import { createPayPalOrder, PAYPAL_CONFIGURED } from '@/lib/paypal'
import { createRouteClient } from '@/lib/supabase/route'
import { createReadClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/ratelimit'

// POST { pool_id }
// Creates a PayPal order and returns the order ID for Smart Buttons
export async function POST(req: Request) {
  if (!PAYPAL_CONFIGURED) {
    return NextResponse.json({ error: 'PayPal not configured' }, { status: 503 })
  }

  const { pool_id } = await req.json()
  if (!pool_id) {
    return NextResponse.json({ error: 'pool_id required' }, { status: 400 })
  }

  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit: 5 payment initiations per user per 10 minutes
  const rlResponse = await rateLimit(session.user.id, 'payment-init', { requests: 5, window: '10 m' })
  if (rlResponse) return rlResponse

  const { data: pool } = await supabase
    .from('pools')
    .select('id, name, entry_fee, commissioner_id')
    .eq('id', pool_id)
    .single()

  if (!pool || !pool.entry_fee || pool.entry_fee <= 0) {
    return NextResponse.json({ error: 'No entry fee configured' }, { status: 400 })
  }

  if (pool.entry_fee > 10000) {
    return NextResponse.json({ error: 'Entry fee exceeds maximum' }, { status: 400 })
  }

  // Get commissioner's PayPal merchant ID
  const adminDb = createReadClient()
  const { data: commissionerProfile } = await adminDb
    .from('profiles')
    .select('*')
    .eq('id', pool.commissioner_id)
    .single()

  const paypalMerchantId = (commissionerProfile as any)?.paypal_merchant_id
  const paypalOnboarded = (commissionerProfile as any)?.paypal_onboarded

  if (!paypalOnboarded || !paypalMerchantId) {
    return NextResponse.json({ error: 'Commissioner PayPal not connected' }, { status: 400 })
  }

  const order = await createPayPalOrder(
    pool.entry_fee,
    'USD',
    paypalMerchantId,
    { pool_id, user_id: session.user.id }
  )

  if (!order) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  return NextResponse.json({ orderID: order.id })
}
