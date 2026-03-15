import { verifyPayPalWebhook, PAYPAL_CONFIGURED } from '@/lib/paypal'
import { createClient } from '@supabase/supabase-js'
import { notifyCommissioner } from '@/lib/notify'

export async function POST(req: Request) {
  if (!PAYPAL_CONFIGURED) {
    return Response.json({ error: 'Not configured' }, { status: 503 })
  }

  const body = await req.text()
  const headersList = Object.fromEntries(req.headers.entries())

  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) {
    return Response.json({ error: 'Webhook ID not configured' }, { status: 503 })
  }

  const valid = await verifyPayPalWebhook(headersList, body, webhookId)
  if (!valid) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(body)

  if (event.event_type === 'CHECKOUT.ORDER.APPROVED' || event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const customId = event.resource?.purchase_units?.[0]?.custom_id
    if (customId) {
      let parsed: { pool_id?: string; user_id?: string }
      try {
        parsed = JSON.parse(customId)
      } catch {
        return Response.json({ error: 'Invalid custom_id' }, { status: 400 })
      }
      const { pool_id, user_id } = parsed

      // Validate metadata UUIDs to prevent injection
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!pool_id || !user_id || !UUID_REGEX.test(pool_id) || !UUID_REGEX.test(user_id)) {
        return Response.json({ error: 'Invalid metadata' }, { status: 400 })
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Update pool_members (backward compat)
      await supabase.from('pool_members').update({
        payment_status: 'paid',
        payment_date: new Date().toISOString(),
        payment_note: 'Paid via PayPal webhook',
      }).eq('pool_id', pool_id).eq('user_id', user_id)

      // Get pool entry fee
      const { data: pool } = await supabase
        .from('pools')
        .select('entry_fee')
        .eq('id', pool_id)
        .single()

      const orderId = event.resource?.id || null

      // Insert/update payments table
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('pool_id', pool_id)
        .eq('user_id', user_id)
        .eq('paypal_order_id', orderId)
        .maybeSingle()

      const paymentRecord = {
        pool_id,
        user_id,
        amount: Number(pool?.entry_fee) || 0,
        status: 'paid',
        payment_method: 'paypal',
        payment_platform: 'paypal',
        paypal_order_id: orderId,
        payment_date: new Date().toISOString(),
        payment_note: 'Paid via PayPal webhook',
        updated_at: new Date().toISOString(),
      }

      if (existingPayment) {
        await supabase.from('payments').update(paymentRecord).eq('id', existingPayment.id)
      } else {
        await supabase.from('payments').insert(paymentRecord)
      }

      // L-6: Generic notification body — don't expose member name or amount on lock screen
      // Full payment details remain visible in the manage dashboard (/pools/{id}/manage)
      await notifyCommissioner(pool_id, {
        type: 'payment_received',
        title: '💰 Payment received',
        message: 'A member confirmed their payment — tap to view pool',
        action_url: `/pools/${pool_id}/manage`,
      })
    }
  }

  return Response.json({ received: true })
}
