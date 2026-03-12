import { NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route'
import {
  parseEspnScoreboard,
  buildSimulationScores,
  isCacheValid,
  getCache,
  setCache,
  type LiveScoresResponse,
} from '@/lib/liveScores'

const ESPN_SCOREBOARD_URL =
  'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?groups=50&limit=64'

// Cache TTL: 30 seconds for active games, 5 minutes otherwise
const ACTIVE_CACHE_TTL = 30_000
const IDLE_CACHE_TTL = 5 * 60_000

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const forceMode = searchParams.get('mode') // 'espn' | 'simulation' | 'database'

  // Return cached response if still valid
  if (isCacheValid()) {
    const cached = getCache()!
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': 'public, max-age=30',
        'X-Cache': 'HIT',
      },
    })
  }

  const now = new Date().toISOString()

  // --- Try ESPN API first (unless forced otherwise) ---
  if (forceMode !== 'simulation' && forceMode !== 'database') {
    try {
      const espnRes = await fetch(ESPN_SCOREBOARD_URL, {
        next: { revalidate: 30 },
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; UFSL/1.0)',
        },
        signal: AbortSignal.timeout(5000),
      })

      if (espnRes.ok) {
        const json = await espnRes.json()
        const games = parseEspnScoreboard(json)
        const hasActiveGames = games.some(
          g => g.status === 'in_progress' || g.status === 'halftime'
        )

        const response: LiveScoresResponse = {
          games,
          source: 'espn',
          cachedUntil: new Date(
            Date.now() + (hasActiveGames ? ACTIVE_CACHE_TTL : IDLE_CACHE_TTL)
          ).toISOString(),
          fetchedAt: now,
        }

        setCache(response, hasActiveGames ? ACTIVE_CACHE_TTL : IDLE_CACHE_TTL)

        return NextResponse.json(response, {
          headers: {
            'Cache-Control': hasActiveGames ? 'public, max-age=30' : 'public, max-age=300',
            'X-Cache': 'MISS',
            'X-Source': 'espn',
          },
        })
      }
    } catch {
      // ESPN failed — fall through to DB/simulation
    }
  }

  // --- Fall back to our database (simulation/manual mode) ---
  try {
    const supabase = createRouteClient()
    const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any

    const { data: gamesRaw } = await db
      .from('games')
      .select('id, round, status, team1_id, team2_id, team1_score, team2_score, scheduled_at, winner_id')
      .in('status', ['in_progress', 'completed', 'scheduled'])
      .order('round')
      .order('game_number')

    const games = gamesRaw ?? []

    // Get unique team IDs
    const teamIds = new Set<string>()
    for (const g of games) {
      if (g.team1_id) teamIds.add(g.team1_id)
      if (g.team2_id) teamIds.add(g.team2_id)
    }

    const teamIdArray = Array.from(teamIds)
    const { data: teamsRaw } = teamIdArray.length > 0
      ? await db.from('teams').select('id, name, abbreviation, seed').in('id', teamIdArray)
      : { data: [] }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teamsMap = new Map<string, any>((teamsRaw ?? []).map((t: any) => [t.id, t]))
    const liveGames = buildSimulationScores(games, teamsMap)

    const hasActiveGames = liveGames.some(
      g => g.status === 'in_progress' || g.status === 'halftime'
    )

    const response: LiveScoresResponse = {
      games: liveGames,
      source: 'database',
      cachedUntil: new Date(
        Date.now() + (hasActiveGames ? ACTIVE_CACHE_TTL : IDLE_CACHE_TTL)
      ).toISOString(),
      fetchedAt: now,
    }

    setCache(response, hasActiveGames ? ACTIVE_CACHE_TTL : IDLE_CACHE_TTL)

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': hasActiveGames ? 'public, max-age=30' : 'public, max-age=300',
        'X-Cache': 'MISS',
        'X-Source': 'database',
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch scores', detail: String(err) },
      { status: 500 }
    )
  }
}
