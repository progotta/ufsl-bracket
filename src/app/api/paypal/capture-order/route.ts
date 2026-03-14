import { capturePayPalOrder, PAYPAL_CONFIGURED } from '@/lib/paypal'
import { createRouteClient } from '@/lib/supabase/route'
import { createReadClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST { orderID, pool_id }
// Captures the PayPal payment after member approves
export async function POST(req: Request) {
  if (!PAYPAL_CONFIGURED) {
    return NextResponse.json({ error: 'PayPal not configured' }, { status: 503 })
  }

  const { orderID, pool_id } = await req.json()
  if (!orderID || !pool_id) {
    return NextResponse.json({ error: 'orderID and pool_id required' }, { status: 400 })
  }

  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const capture = await capturePayPalOrder(orderID)
  if (capture?.status === 'COMPLETED') {
    // Update pool_members (backward compat)
    await supabase
      .from('pool_members')
      .update({
        payment_status: 'paid',
        payment_date: new Date().toISOString(),
        payment_note: `Paid via PayPal (${orderID})`,
        paypal_order_id: orderID,
      } as any)
      .eq('pool_id', pool_id)
      .eq('user_id', session.user.id)

    // Insert into payments table
    const adminDb = createReadClient()
    const { data: pool } = await adminDb
      .from('pools')
      .select('entry_fee')
      .eq('id', pool_id)
      .single()

    await adminDb.from('payments').insert({
      pool_id,
      user_id: session.user.id,
      amount: Number(pool?.entry_fee) || 0,
      status: 'paid',
      payment_method: 'paypal',
      payment_platform: 'paypal',
      paypal_order_id: orderID,
      payment_date: new Date().toISOString(),
      payment_note: `Paid via PayPal (${orderID})`,
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Payment capture failed' }, { status: 400 })
}
