import { createRouteClient } from '@/lib/supabase/route'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createRouteClient()
  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') || 'all-time' // 'all-time' | 'this-round' | 'today'

  try {
    // For now, global leaderboard uses all-time aggregated scores
    // In the future: 'this-round' and 'today' filters can use leaderboard_snapshots
    const { data, error } = await supabase
      .from('global_leaderboard')
      .select('*')
      .order('rank', { ascending: true })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ data: data || [], filter })
  } catch (err) {
    console.error('[leaderboard/global]', err)
    return NextResponse.json({ error: 'Failed to fetch global leaderboard' }, { status: 500 })
  }
}
