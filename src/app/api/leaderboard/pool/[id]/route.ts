import { createRouteClient } from '@/lib/supabase/route'
import { NextRequest, NextResponse } from 'next/server'
import { getCached } from '@/lib/cache'
import { rateLimit } from '@/lib/ratelimit'

const CACHE_TTL = 60 // 60 seconds

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rlResponse = await rateLimit(ip, 'leaderboard', { requests: 30, window: '1 m' })
  if (rlResponse) return rlResponse

  const supabase = createRouteClient()
  const poolId = params.id

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify requesting user is a member of this pool (or pool is public)
    const { data: membership } = await supabase
      .from('pool_members')
      .select('id')
      .eq('pool_id', poolId)
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (!membership) {
      const { data: pool } = await supabase
        .from('pools')
        .select('commissioner_id, is_public')
        .eq('id', poolId)
        .maybeSingle()

      if (!pool?.is_public && pool?.commissioner_id !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const cacheKey = `leaderboard:pool:${poolId}`

    const entries = await getCached(
      cacheKey,
      async () => {
        // Fetch current leaderboard
        const { data: current, error } = await supabase
          .from('leaderboard')
          .select('*')
          .eq('pool_id', poolId)
          .order('rank', { ascending: true })

        if (error) throw error

        // Fetch previous round snapshots for movement indicators
        const { data: snapshots } = await supabase
          .from('leaderboard_snapshots')
          .select('user_id, rank, round')
          .eq('pool_id', poolId)
          .order('round', { ascending: false })

        // Build a map of previous ranks (latest snapshot)
        const prevRankMap = new Map<string, number>()
        if (snapshots && snapshots.length > 0) {
          const latestRound = snapshots[0].round
          const latest = snapshots.filter(s => s.round === latestRound)
          for (const s of latest) {
            prevRankMap.set(s.user_id, s.rank)
          }
        }

        // Fallback: if no snapshots, try previous_rank from brackets table
        if (prevRankMap.size === 0 && current && current.length > 0) {
          const bracketIds = current.map(e => e.bracket_id).filter(Boolean)
          if (bracketIds.length > 0) {
            const { data: brackets } = await supabase
              .from('brackets')
              .select('id, user_id, previous_rank')
              .in('id', bracketIds)
            if (brackets) {
              for (const b of brackets) {
                if (b.previous_rank !== null && b.previous_rank !== undefined) {
                  prevRankMap.set(b.user_id, b.previous_rank)
                }
              }
            }
          }
        }

        // Fetch per-round correct picks for each bracket in one query
        const bracketIds = (current || []).map(e => e.bracket_id).filter(Boolean)
        const roundPicksMap = new Map<string, number[]>() // bracketId → [r1,r2,r3,r4,r5,r6]

        if (bracketIds.length > 0) {
          // Get all completed games with winner_id and their rounds
          const { data: games } = await supabase
            .from('games')
            .select('id, round, game_number, region, winner_id, season')
            .eq('season', 2026)
            .eq('status', 'completed')
            .not('winner_id', 'is', null)

          if (games && games.length > 0) {
            // Get picks for all brackets at once
            const { data: brackets } = await supabase
              .from('brackets')
              .select('id, picks')
              .in('id', bracketIds)

            if (brackets) {
              for (const bracket of brackets) {
                const picks = (bracket.picks || {}) as Record<string, string>
                const roundCounts = [0, 0, 0, 0, 0, 0]
                for (const game of games) {
                  const round = game.round as number
                  // Picks are keyed by slug (e.g. "east-r1-g2"), not UUID
                  const slug = `${(game.region as string || '').toLowerCase()}-r${game.round}-g${game.game_number}`
                  if (round >= 1 && round <= 6 && picks[slug] === game.winner_id) {
                    roundCounts[round - 1]++
                  }
                }
                roundPicksMap.set(bracket.id, roundCounts)
              }
            }
          }
        }

        // Extract champion picks and check alive status
        const championMap = new Map<string, { name: string; abbr: string; alive: boolean }>()

        if (bracketIds.length > 0) {
          // Reuse brackets data already fetched above (or fetch if needed)
          const { data: champBrackets } = await supabase
            .from('brackets')
            .select('id, picks')
            .in('id', bracketIds)

          if (champBrackets) {
            const championTeamIds = new Set<string>()
            const bracketChampionMap = new Map<string, string>() // bracketId → teamId

            for (const bracket of champBrackets) {
              const picks = (bracket.picks || {}) as Record<string, string>
              const champId = picks['championship-r6-g1']
              if (champId) {
                championTeamIds.add(champId)
                bracketChampionMap.set(bracket.id, champId)
              }
            }

            if (championTeamIds.size > 0) {
              // Fetch champion team details
              const { data: teams } = await supabase
                .from('teams')
                .select('id, name, abbreviation')
                .in('id', Array.from(championTeamIds))

              // Fetch eliminated teams (losers of completed games)
              const { data: completedGames } = await supabase
                .from('games')
                .select('team1_id, team2_id, winner_id')
                .eq('status', 'completed')
                .not('winner_id', 'is', null)

              const eliminatedSet = new Set<string>()
              if (completedGames) {
                for (const g of completedGames) {
                  const loserId = g.team1_id === g.winner_id ? g.team2_id : g.team1_id
                  if (loserId) eliminatedSet.add(loserId)
                }
              }

              const teamMap = new Map<string, { name: string; abbreviation: string }>()
              if (teams) {
                for (const t of teams) {
                  teamMap.set(t.id, { name: t.name, abbreviation: t.abbreviation })
                }
              }

              for (const [bracketId, teamId] of Array.from(bracketChampionMap.entries())) {
                const team = teamMap.get(teamId)
                if (team) {
                  championMap.set(bracketId, {
                    name: team.name,
                    abbr: team.abbreviation,
                    alive: !eliminatedSet.has(teamId),
                  })
                }
              }
            }
          }
        }

        // Attach movement + per-round picks + champion to each entry
        return (current || []).map(entry => {
          const prevRank = prevRankMap.get(entry.user_id)
          let movement: number | null = null
          if (prevRank !== undefined) {
            movement = prevRank - (entry.rank as number) // positive = moved up
          }
          const roundPicks = entry.bracket_id ? roundPicksMap.get(entry.bracket_id) ?? null : null
          const champ = entry.bracket_id ? championMap.get(entry.bracket_id) : undefined
          return {
            ...entry,
            movement,
            round_picks: roundPicks,
            ...(champ ? { champion_name: champ.name, champion_abbr: champ.abbr, champion_alive: champ.alive } : {}),
          }
        })
      },
      CACHE_TTL
    )

    return NextResponse.json(
      { data: entries },
      {
        headers: {
          'Cache-Control': `public, max-age=${CACHE_TTL}`,
          'X-Cache-Key': cacheKey,
        },
      }
    )
  } catch (err) {
    console.error('[leaderboard/pool]', err)
    return NextResponse.json({ error: 'Failed to fetch pool leaderboard' }, { status: 500 })
  }
}
