import { NextRequest, NextResponse } from 'next/server'
import { createServerClient as createClient } from '@/lib/supabase/server'
import { computeCrowdPicks, type CrowdPickResult } from '@/lib/predictions'
import { getCached } from '@/lib/cache'

/**
 * GET /api/predictions/crowd-picks?gameIds=game1,game2&team1s=t1,t1&team2s=t2,t2
 *
 * Returns crowd pick percentages for one or more games by querying
 * submitted brackets.
 *
 * Query params:
 *   gameIds  - comma-separated game IDs
 *   team1s   - comma-separated team1 IDs (parallel to gameIds)
 *   team2s   - comma-separated team2 IDs (parallel to gameIds)
 *   poolId   - optional pool filter
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const gameIdsParam = searchParams.get('gameIds')
  const team1sParam = searchParams.get('team1s')
  const team2sParam = searchParams.get('team2s')
  const poolId = searchParams.get('poolId')

  if (!gameIdsParam || !team1sParam || !team2sParam) {
    return NextResponse.json(
      { error: 'Missing required params: gameIds, team1s, team2s' },
      { status: 400 }
    )
  }

  const gameIds = gameIdsParam.split(',').map(s => s.trim())
  const team1s = team1sParam.split(',').map(s => s.trim())
  const team2s = team2sParam.split(',').map(s => s.trim())

  if (gameIds.length !== team1s.length || gameIds.length !== team2s.length) {
    return NextResponse.json(
      { error: 'gameIds, team1s, and team2s must have the same length' },
      { status: 400 }
    )
  }

  try {
    const cacheKey = `crowd-picks:${poolId ?? 'all'}:${gameIdsParam}`

    const cached = await getCached(cacheKey, async () => {
      const supabase = await createClient()

      let query = supabase
        .from('brackets')
        .select('picks')
        .eq('is_submitted', true)

      if (poolId) {
        query = query.eq('pool_id', poolId)
      }

      const { data, error } = await query

      if (error) throw error

      const allPicks = (data ?? []).map(b => b.picks as Record<string, string>)
      const totalBrackets = allPicks.length

      const results: CrowdPickResult[] = gameIds.map((gameId, i) =>
        computeCrowdPicks(allPicks, gameId, team1s[i], team2s[i])
      )

      return { results, totalBrackets, poolId: poolId ?? 'all' }
    }, 60)

    return NextResponse.json(cached)
  } catch (err) {
    console.error('[crowd-picks] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
