import { getStripe } from '@/lib/stripe'
import { createRouteClient } from '@/lib/supabase/route'
import { createReadClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/stripe/checkout
// Body: { pool_id: string }
// Creates a Checkout session for the member to pay the entry fee
export async function POST(req: Request) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
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

  // Use admin client to get commissioner's Stripe info
  const adminDb = createReadClient()

  const { data: pool } = await supabase
    .from('pools')
    .select('id, name, entry_fee, commissioner_id')
    .eq('id', pool_id)
    .single()

  if (!pool || !pool.entry_fee || pool.entry_fee <= 0) {
    return NextResponse.json({ error: 'No entry fee configured' }, { status: 400 })
  }

  // Get commissioner's Stripe account
  const { data: commissionerProfile } = await adminDb
    .from('profiles')
    .select('stripe_account_id, stripe_onboarded')
    .eq('id', pool.commissioner_id)
    .single()

  if (!commissionerProfile?.stripe_onboarded || !commissionerProfile?.stripe_account_id) {
    return NextResponse.json({ error: 'Commissioner has not connected Stripe' }, { status: 400 })
  }

  // Get the member record
  const { data: member } = await supabase
    .from('pool_members')
    .select('id, payment_status')
    .eq('pool_id', pool_id)
    .eq('user_id', session.user.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'You are not a member of this pool' }, { status: 400 })
  }

  if (member.payment_status === 'paid') {
    return NextResponse.json({ error: 'Already paid' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ufsl.net'

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${pool.name} — Bracket Entry Fee`,
          description: `Entry fee for ${pool.name} bracket pool`,
        },
        unit_amount: Math.round(pool.entry_fee * 100),
      },
      quantity: 1,
    }],
    success_url: `${siteUrl}/pools/${pool_id}?payment=success`,
    cancel_url: `${siteUrl}/pools/${pool_id}?payment=cancelled`,
    metadata: {
      pool_id,
      member_id: member.id,
      user_id: session.user.id,
    },
    payment_intent_data: {
      transfer_data: {
        destination: commissionerProfile.stripe_account_id,
      },
    },
  })

  // Store session ID on pool_member for tracking
  await supabase
    .from('pool_members')
    .update({ stripe_session_id: checkoutSession.id })
    .eq('id', member.id)

  return NextResponse.json({ url: checkoutSession.url })
}
