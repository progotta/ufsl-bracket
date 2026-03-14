import { verifyPayPalWebhook, PAYPAL_CONFIGURED } from '@/lib/paypal'
import { createClient } from '@supabase/supabase-js'

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
      const { pool_id, user_id } = JSON.parse(customId)
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      await supabase.from('pool_members').update({
        payment_status: 'paid',
        payment_date: new Date().toISOString(),
        payment_note: 'Paid via PayPal webhook',
      }).eq('pool_id', pool_id).eq('user_id', user_id)
    }
  }

  return Response.json({ received: true })
}
