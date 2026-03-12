/**
 * Teams API — fetches active teams with Redis caching (1 hour TTL).
 * Teams rarely change, so long-lived caching is safe here.
 */
import { NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route'
import { getCached } from '@/lib/cache'

const CACHE_TTL = 60 * 60 // 1 hour — teams rarely change

export async function GET() {
  try {
    const supabase = createRouteClient()

    const teams = await getCached(
      'teams:active',
      async () => {
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .eq('is_active', true)
          .order('seed', { ascending: true })

        if (error) throw error
        return data || []
      },
      CACHE_TTL
    )

    return NextResponse.json(
      { data: teams },
      {
        headers: {
          'Cache-Control': `public, max-age=${CACHE_TTL}`,
          'X-Cache-Key': 'teams:active',
        },
      }
    )
  } catch (err) {
    console.error('[api/teams]', err)
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}
