import { createRouteClient } from '@/lib/supabase/route'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteClient()
  const poolId = params.id

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    const entries = (current || []).map(entry => {
      const prevRank = prevRankMap.get(entry.user_id)
      let movement: number | null = null
      if (prevRank !== undefined) {
        movement = prevRank - (entry.rank as number) // positive = moved up
      }
      return { ...entry, movement }
    })

    return NextResponse.json({ data: entries })
  } catch (err) {
    console.error('[leaderboard/pool]', err)
    return NextResponse.json({ error: 'Failed to fetch pool leaderboard' }, { status: 500 })
  }
}
