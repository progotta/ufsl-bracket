import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * GET /api/cron/achievements
 * Called nightly by Vercel Cron. Protected by CRON_SECRET.
 * Awards achievements based on current DB state — fully idempotent.
 */
export async function GET(req: NextRequest) {
  // Vercel cron sends Authorization: Bearer {CRON_SECRET}
  const authHeader = req.headers.get('authorization')
  const secret = authHeader?.replace('Bearer ', '') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()
  const awarded: { userId: string; achievementId: string }[] = []
  const errors: string[] = []

  try {
    // ── 1. social_butterfly: joined 3+ pools ─────────────────────────────
    const { data: multiPoolUsers } = await db
      .from('pool_members')
      .select('user_id')

    if (multiPoolUsers) {
      const countByUser: Record<string, number> = {}
      for (const row of multiPoolUsers) {
        countByUser[row.user_id] = (countByUser[row.user_id] || 0) + 1
      }
      const eligible = Object.entries(countByUser).filter(([, count]) => count >= 3)
      if (eligible.length > 0) {
        const rows = eligible.map(([userId, count]) => ({
          user_id: userId,
          achievement_id: 'social_butterfly',
          metadata: { count },
        }))
        const { data: inserted } = await db
          .from('user_achievements')
          .upsert(rows, { onConflict: 'user_id,achievement_id', ignoreDuplicates: true })
          .select('user_id, achievement_id')
        if (inserted) awarded.push(...inserted.map((r: any) => ({ userId: r.user_id, achievementId: r.achievement_id })))
      }
    }

    // ── 2. first_bracket: submitted at least one bracket ─────────────────
    const { data: submittedBrackets } = await db
      .from('brackets')
      .select('user_id, id')
      .eq('is_submitted', true)

    if (submittedBrackets) {
      const seenUsers = new Set<string>()
      const rows: any[] = []
      for (const b of submittedBrackets) {
        if (!seenUsers.has(b.user_id)) {
          seenUsers.add(b.user_id)
          rows.push({ user_id: b.user_id, achievement_id: 'first_bracket', metadata: { bracket_id: b.id } })
        }
      }
      if (rows.length > 0) {
        const { data: inserted } = await db
          .from('user_achievements')
          .upsert(rows, { onConflict: 'user_id,achievement_id', ignoreDuplicates: true })
          .select('user_id, achievement_id')
        if (inserted) awarded.push(...inserted.map((r: any) => ({ userId: r.user_id, achievementId: r.achievement_id })))
      }
    }

    // ── 3. ice_cold: first to submit in each pool ─────────────────────────
    const { data: pools } = await db.from('pools').select('id')
    if (pools) {
      for (const pool of pools) {
        const { data: first } = await db
          .from('brackets')
          .select('user_id, id')
          .eq('pool_id', pool.id)
          .eq('is_submitted', true)
          .order('updated_at', { ascending: true })
          .limit(1)
          .single()
        if (first) {
          await db.from('user_achievements').upsert(
            { user_id: first.user_id, achievement_id: 'ice_cold', metadata: { pool_id: pool.id } },
            { onConflict: 'user_id,achievement_id', ignoreDuplicates: true }
          )
        }
      }
    }

    // ── 4. trash_talker: sent 10+ smack messages ─────────────────────────
    const { data: smackCounts } = await db
      .from('smack_messages')
      .select('user_id')

    if (smackCounts) {
      const countByUser: Record<string, number> = {}
      for (const row of smackCounts) {
        countByUser[row.user_id] = (countByUser[row.user_id] || 0) + 1
      }
      const eligible10 = Object.entries(countByUser).filter(([, c]) => c >= 10)
      const eligible50 = Object.entries(countByUser).filter(([, c]) => c >= 50)

      const rows: any[] = [
        ...eligible10.map(([userId, count]) => ({ user_id: userId, achievement_id: 'trash_talker', metadata: { count } })),
        ...eligible50.map(([userId, count]) => ({ user_id: userId, achievement_id: 'roaster', metadata: { count } })),
      ]
      if (rows.length > 0) {
        const { data: inserted } = await db
          .from('user_achievements')
          .upsert(rows, { onConflict: 'user_id,achievement_id', ignoreDuplicates: true })
          .select('user_id, achievement_id')
        if (inserted) awarded.push(...inserted.map((r: any) => ({ userId: r.user_id, achievementId: r.achievement_id })))
      }
    }

    // ── 5. Pick-based achievements (on_fire, lightning, sharpshooter, flawless_round) ──
    const { count: scoredGames } = await db
      .from('games')
      .select('id', { count: 'exact', head: true })
      .not('winner_id', 'is', null)

    if ((scoredGames ?? 0) > 0) {
      const { data: games } = await db
        .from('games')
        .select('id, winner_id, loser_id, round, home_team_id, away_team_id')
        .not('winner_id', 'is', null)
        .order('round', { ascending: true })

      const { data: brackets } = await db
        .from('brackets')
        .select('id, user_id, pool_id, picks')
        .eq('is_submitted', true)

      if (games && brackets) {
        const gameResults: Record<string, string> = {}
        for (const g of games) {
          if (g.winner_id) gameResults[g.id] = g.winner_id
        }

        const userStats: Record<string, {
          totalCorrect: number
          maxStreak: number
          currentStreak: number
          byRound: Record<number, { correct: number; total: number }>
        }> = {}

        for (const bracket of brackets) {
          const picks = (bracket.picks as Record<string, string>) || {}
          const userId = bracket.user_id

          if (!userStats[userId]) {
            userStats[userId] = { totalCorrect: 0, maxStreak: 0, currentStreak: 0, byRound: {} }
          }

          for (const game of games) {
            const pickedWinner = picks[game.id]
            const actualWinner = gameResults[game.id]
            if (!pickedWinner || !actualWinner) continue

            const round = game.round || 1
            if (!userStats[userId].byRound[round]) {
              userStats[userId].byRound[round] = { correct: 0, total: 0 }
            }
            userStats[userId].byRound[round].total++

            if (pickedWinner === actualWinner) {
              userStats[userId].byRound[round].correct++
              userStats[userId].totalCorrect++
              userStats[userId].currentStreak++
              userStats[userId].maxStreak = Math.max(userStats[userId].maxStreak, userStats[userId].currentStreak)
            } else {
              userStats[userId].currentStreak = 0
            }
          }
        }

        const pickRows: any[] = []
        for (const [userId, stats] of Object.entries(userStats)) {
          if (stats.maxStreak >= 5) {
            pickRows.push({ user_id: userId, achievement_id: 'on_fire', metadata: { streak: stats.maxStreak } })
          }
          if (stats.maxStreak >= 10) {
            pickRows.push({ user_id: userId, achievement_id: 'lightning', metadata: { streak: stats.maxStreak } })
          }
          for (const [round, { correct, total }] of Object.entries(stats.byRound)) {
            if (correct >= 10) {
              pickRows.push({ user_id: userId, achievement_id: 'sharpshooter', metadata: { round: Number(round), correct } })
            }
            if (total >= 8 && correct === total) {
              pickRows.push({ user_id: userId, achievement_id: 'flawless_round', metadata: { round: Number(round), correct } })
            }
          }
        }

        if (pickRows.length > 0) {
          const { data: inserted } = await db
            .from('user_achievements')
            .upsert(pickRows, { onConflict: 'user_id,achievement_id', ignoreDuplicates: true })
            .select('user_id, achievement_id')
          if (inserted) awarded.push(...inserted.map((r: any) => ({ userId: r.user_id, achievementId: r.achievement_id })))
        }
      }
    }

    // ── 6. Pool end achievements (champion, so_close, bracket_buster) ────
    const { data: completedPools } = await db
      .from('pools')
      .select('id')
      .eq('status', 'completed')

    if (completedPools && completedPools.length > 0) {
      for (const pool of completedPools) {
        const { data: leaderboard } = await db
          .from('brackets')
          .select('user_id, score')
          .eq('pool_id', pool.id)
          .eq('is_submitted', true)
          .order('score', { ascending: false })

        if (leaderboard && leaderboard.length > 0) {
          const winner = leaderboard[0]
          const second = leaderboard[1]
          const last = leaderboard[leaderboard.length - 1]

          const endRows: any[] = [
            { user_id: winner.user_id, achievement_id: 'champion', metadata: { pool_id: pool.id } },
          ]
          if (second) {
            endRows.push({ user_id: second.user_id, achievement_id: 'so_close', metadata: { pool_id: pool.id } })
          }
          if (last && leaderboard.length >= 3 && last.user_id !== winner.user_id) {
            endRows.push({ user_id: last.user_id, achievement_id: 'bracket_buster', metadata: { pool_id: pool.id } })
          }

          await db
            .from('user_achievements')
            .upsert(endRows, { onConflict: 'user_id,achievement_id', ignoreDuplicates: true })
        }
      }
    }

  } catch (err: any) {
    errors.push(err.message)
    console.error('[cron/achievements] error:', err)
  }

  return NextResponse.json({
    ok: true,
    awarded: awarded.length,
    newAwards: awarded,
    errors,
    runAt: new Date().toISOString(),
  })
}
