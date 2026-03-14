import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { notifyCommissioner } from '@/lib/notify'

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

    // Validate metadata UUIDs to prevent injection
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (pool_id && user_id && (!UUID_REGEX.test(pool_id) || !UUID_REGEX.test(user_id))) {
      return Response.json({ error: 'Invalid metadata' }, { status: 400 })
    }

    if (pool_id && user_id) {
      // Update pool_members (backward compat)
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

      // Get pool entry fee for payment amount
      const { data: pool } = await supabase
        .from('pools')
        .select('entry_fee')
        .eq('id', pool_id)
        .single()

      // Insert/update payments table
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('pool_id', pool_id)
        .eq('user_id', user_id)
        .eq('stripe_session_id', session.id)
        .maybeSingle()

      const paymentRecord = {
        pool_id,
        user_id,
        amount: Number(pool?.entry_fee) || 0,
        status: 'paid',
        payment_method: 'stripe',
        payment_platform: 'stripe',
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        payment_date: new Date().toISOString(),
        payment_note: `Paid via Stripe (${session.id})`,
        updated_at: new Date().toISOString(),
      }

      if (existingPayment) {
        await supabase.from('payments').update(paymentRecord).eq('id', existingPayment.id)
      } else {
        await supabase.from('payments').insert(paymentRecord)
      }

      // Notify commissioner of payment
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user_id)
        .single()
      const memberName = profile?.display_name || 'A member'
      const amount = Number(pool?.entry_fee) || 0
      await notifyCommissioner(pool_id, {
        type: 'payment_received',
        title: '💰 Payment received',
        message: `${memberName} paid $${amount} entry fee via Stripe`,
        action_url: `/pools/${pool_id}/manage`,
      })
    }
  }

  return Response.json({ received: true })
}
