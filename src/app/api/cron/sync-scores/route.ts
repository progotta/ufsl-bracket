/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getPickSlug } from '@/lib/bracketUtils'
import { ROUND_POINTS } from '@/lib/bracket'
import { invalidateCache } from '@/lib/cache'
import { advanceWinner } from '@/lib/bracketAdvancement'

const ESPN_SCOREBOARD_URL =
  'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?groups=50&limit=64'

/**
 * GET /api/cron/sync-scores
 *
 * Vercel Cron job — runs every 5 minutes.
 * Fetches ESPN scoreboard, detects finalized games, and updates scores in DB.
 *
 * Requires CRON_SECRET env var set in Vercel dashboard.
 */
export async function GET(req: NextRequest) {
  // ── Auth: verify CRON_SECRET ─────────────────────────────────────────
  // Always enforce in production. Skip only in local dev (no CRON_SECRET set).
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get('authorization')
    const secret = authHeader?.replace('Bearer ', '')
    if (!secret || secret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else if (process.env.NODE_ENV === 'production') {
    // CRON_SECRET must be set in production — fail closed
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  // ── Time window check: 10am–2am Mountain Time ───────────────────────
  // Allows late games finishing after midnight. Block 2am–10am only.
  const now = new Date()
  const mtHour = parseInt(
    now.toLocaleString('en-US', { timeZone: 'America/Denver', hour: 'numeric', hour12: false })
  )
  if (mtHour >= 2 && mtHour < 10) {
    return NextResponse.json({ skipped: 'outside_window', mtHour })
  }

  const db = createServiceClient() as any

  // ── Tournament active check ─────────────────────────────────────────
  const { count } = await db
    .from('games')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'completed')

  if ((count ?? 0) === 0) {
    return NextResponse.json({ skipped: 'tournament_complete' })
  }

  // ── Fetch ESPN scoreboard ───────────────────────────────────────────
  const espnRes = await fetch(ESPN_SCOREBOARD_URL)
  if (!espnRes.ok) {
    return NextResponse.json({ error: 'ESPN fetch failed', status: espnRes.status }, { status: 502 })
  }
  const espnData = await espnRes.json()
  const events = espnData?.events ?? []

  // ── Pre-load teams by espn_id for fast lookup ───────────────────────
  const { data: allTeams } = await db.from('teams').select('id, espn_id')
  // Key by string to avoid int/text cast issues (DB stores espn_id as text)
  const teamByEspnId: Record<string, string> = {}
  for (const t of allTeams ?? []) {
    if (t.espn_id) teamByEspnId[String(t.espn_id)] = t.id
  }

  // ── Pre-load incomplete games ───────────────────────────────────────
  const { data: incompleteGames } = await db
    .from('games')
    .select('*')
    .neq('status', 'completed')

  const updated: { gameId: string; slug: string; winner: string }[] = []
  const errors: string[] = []

  for (const event of events) {
    try {
      const statusName = event?.status?.type?.name
      if (statusName !== 'STATUS_FINAL') continue

      const competitors = event?.competitions?.[0]?.competitors ?? []
      if (competitors.length !== 2) continue

      const espnWinner = competitors.find((c: any) => c.winner === true)
      const espnLoser = competitors.find((c: any) => c.winner !== true)
      if (!espnWinner || !espnLoser) continue

      const winnerEspnId = String(espnWinner.team.id)
      const loserEspnId = String(espnLoser.team.id)
      const winnerDbId = teamByEspnId[winnerEspnId]
      const loserDbId = teamByEspnId[loserEspnId]
      if (!winnerDbId || !loserDbId) continue

      // Find matching incomplete game (teams in either order)
      const game = (incompleteGames ?? []).find(
        (g: any) =>
          (g.team1_id === winnerDbId && g.team2_id === loserDbId) ||
          (g.team1_id === loserDbId && g.team2_id === winnerDbId)
      )
      if (!game) continue

      // ── Update game as completed ──────────────────────────────────
      const winnerScore = parseInt(espnWinner.score) || null
      const loserScore = parseInt(espnLoser.score) || null
      const team1IsWinner = game.team1_id === winnerDbId

      const { error: updateError } = await db
        .from('games')
        .update({
          status: 'completed',
          winner_id: winnerDbId,
          team1_score: team1IsWinner ? winnerScore : loserScore,
          team2_score: team1IsWinner ? loserScore : winnerScore,
          completed_at: new Date().toISOString(),
        })
        .eq('id', game.id)

      if (updateError) {
        errors.push(`Update game ${game.id}: ${updateError.message}`)
        continue
      }

      // ── Recalculate scores ────────────────────────────────────────
      const gameSlug = getPickSlug(game)
      const roundPoints = ROUND_POINTS[game.round as number] || 1

      const { error: rpcError } = await db.rpc('recalculate_scores_for_game', {
        p_game_id: gameSlug,
        p_winner_id: winnerDbId,
        p_round_points: roundPoints,
      })
      if (rpcError) {
        console.error(`[sync-scores] recalculate_scores_for_game error for ${gameSlug}:`, rpcError)
        errors.push(`RPC scores ${gameSlug}: ${rpcError.message}`)
      }

      // ── Advance winner to next round ──────────────────────────────
      await advanceWinner(db, game.game_number, winnerDbId)

      // ── Recalculate max possible ──────────────────────────────────
      const { error: maxError } = await db.rpc('recalculate_max_possible_for_game', {
        p_loser_id: loserDbId,
      })
      if (maxError) {
        console.error(`[sync-scores] recalculate_max_possible_for_game error for ${loserDbId}:`, maxError)
        errors.push(`RPC max ${loserDbId}: ${maxError.message}`)
      }

      // Remove from incompleteGames so we don't match it again
      const idx = incompleteGames?.indexOf(game)
      if (idx !== undefined && idx >= 0) incompleteGames?.splice(idx, 1)

      updated.push({ gameId: game.id, slug: gameSlug, winner: winnerDbId })
      console.log(`[sync-scores] Updated game ${gameSlug} — winner: ${winnerDbId}`)
    } catch (err: any) {
      errors.push(`Event error: ${err.message}`)
      console.error('[sync-scores] event processing error:', err)
    }
  }

  // Invalidate games cache if anything changed
  if (updated.length > 0) {
    await invalidateCache('games:all')
  }

  return NextResponse.json({
    updated: updated.length,
    games: updated,
    errors: errors.length > 0 ? errors : undefined,
    runAt: new Date().toISOString(),
  })
}
