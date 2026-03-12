import { createRouteClient } from '@/lib/supabase/route'
import { NextRequest, NextResponse } from 'next/server'
import { getCached } from '@/lib/cache'

const CACHE_TTL = 60 // 60 seconds

export async function GET(req: NextRequest) {
  const supabase = createRouteClient()
  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') || 'all-time' // 'all-time' | 'this-round' | 'today'

  try {
    const cacheKey = `leaderboard:global:${filter}`

    const data = await getCached(
      cacheKey,
      async () => {
        const { data, error } = await supabase
          .from('global_leaderboard')
          .select('*')
          .order('rank', { ascending: true })
          .limit(100)

        if (error) throw error
        return data || []
      },
      CACHE_TTL
    )

    return NextResponse.json(
      { data, filter },
      {
        headers: {
          'Cache-Control': `public, max-age=${CACHE_TTL}`,
          'X-Cache-Key': `leaderboard:global:${filter}`,
        },
      }
    )
  } catch (err) {
    console.error('[leaderboard/global]', err)
    return NextResponse.json({ error: 'Failed to fetch global leaderboard' }, { status: 500 })
  }
}
