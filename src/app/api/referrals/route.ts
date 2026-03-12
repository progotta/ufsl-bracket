import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'

// POST /api/referrals — log that someone clicked an invite link (pre-join tracking)
export async function POST(request: Request) {
  try {
    const { invite_code, referrer_id, pool_id } = await request.json()

    if (!invite_code) {
      return NextResponse.json({ error: 'invite_code required' }, { status: 400 })
    }

    const supabase = createRouteClient()
    const { data: { session } } = await supabase.auth.getSession()

    // Create a referral entry (referred_id will be set when they actually join)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { data, error } = await db.from('referrals').insert({
      referrer_id: referrer_id || null,
      referred_id: session?.user?.id || null,
      pool_id: pool_id || null,
      invite_code,
    }).select().single()

    if (error) {
      // Don't fail hard on referral tracking errors
      console.error('Referral insert error:', error)
      return NextResponse.json({ ok: true, tracked: false })
    }

    return NextResponse.json({ ok: true, tracked: true, referralId: data?.id })
  } catch {
    return NextResponse.json({ ok: true, tracked: false })
  }
}

// GET /api/referrals?pool_id=xxx — get referral stats for a pool
export async function GET(request: Request) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const poolId = searchParams.get('pool_id')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  let query = db
    .from('referrals')
    .select('*')
    .eq('referrer_id', session.user.id)

  if (poolId) {
    query = query.eq('pool_id', poolId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const total = data?.length || 0
  const converted = data?.filter((r: { converted_at: string | null }) => r.converted_at).length || 0

  return NextResponse.json({ referrals: data || [], total, converted })
}
