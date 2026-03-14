import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

// POST /api/webhooks/stripe
// Handles Stripe webhook events — auto-marks members as paid
export async function POST(req: Request) {
  const stripe = getStripe()
  if (!stripe) {
    return Response.json({ error: 'Not configured' }, { status: 503 })
  }

  const body = await req.text()
  const headersList = headers()
  const sig = headersList.get('stripe-signature')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret || !sig) {
    return Response.json({ error: 'Webhook secret not configured' }, { status: 503 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Use service role for DB writes (webhook has no user session)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { pool_id, user_id } = session.metadata || {}

    if (pool_id && user_id) {
      await supabase
        .from('pool_members')
        .update({
          payment_status: 'paid',
          payment_date: new Date().toISOString(),
          payment_note: `Paid via Stripe (${session.id})`,
          stripe_payment_intent_id: session.payment_intent as string,
        })
        .eq('pool_id', pool_id)
        .eq('user_id', user_id)
    }
  }

  return Response.json({ received: true })
}
