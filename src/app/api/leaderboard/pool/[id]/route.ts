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

        // Attach movement to each entry
        return (current || []).map(entry => {
          const prevRank = prevRankMap.get(entry.user_id)
          let movement: number | null = null
          if (prevRank !== undefined) {
            movement = prevRank - (entry.rank as number) // positive = moved up
          }
          return { ...entry, movement }
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
