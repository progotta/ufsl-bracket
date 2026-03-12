import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'

// Friends leaderboard: all users who share at least one pool with the current user
export async function GET() {
  const supabase = createRouteClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get pools the current user is in
    const { data: myMemberships } = await supabase
      .from('pool_members')
      .select('pool_id')
      .eq('user_id', session.user.id)

    const myPoolIds = (myMemberships || []).map(m => m.pool_id)
    if (myPoolIds.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Get all users in those pools
    const { data: poolMates } = await supabase
      .from('pool_members')
      .select('user_id')
      .in('pool_id', myPoolIds)

    const friendIds = Array.from(new Set((poolMates || []).map(m => m.user_id)))
    if (friendIds.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Get their global scores
    const { data: leaderboard, error } = await supabase
      .from('global_leaderboard')
      .select('*')
      .in('user_id', friendIds)
      .order('total_score', { ascending: false })
      .limit(100)

    if (error) throw error

    // Re-rank within friends group
    const ranked = (leaderboard || []).map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
      is_me: entry.user_id === session.user.id,
    }))

    return NextResponse.json({ data: ranked })
  } catch (err) {
    console.error('[leaderboard/friends]', err)
    return NextResponse.json({ error: 'Failed to fetch friends leaderboard' }, { status: 500 })
  }
}
