import { createRouteClient } from '@/lib/supabase/route'
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { notifyCommissioner } from '@/lib/notify'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminDb = createServiceClient()

  // Get pool info (need entry_fee for payment amount)
  const { data: pool } = await adminDb
    .from('pools')
    .select('commissioner_id, entry_fee')
    .eq('id', params.id)
    .single()

  const body = await req.json()
  const { status, note, bracket_id } = body

  const isCommissioner = pool?.commissioner_id === session.user.id

  // Members can only set pending_verification on their own record
  if (!isCommissioner) {
    if (status !== 'pending_verification') {
      return NextResponse.json({ error: 'Only the commissioner can update payment status' }, { status: 403 })
    }
    const { data: memberRecord } = await adminDb
      .from('pool_members')
      .select('user_id')
      .eq('id', params.memberId)
      .single()
    if (!memberRecord || memberRecord.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  if (!['paid', 'unpaid', 'waived', 'pending_verification'].includes(status)) {
    return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 })
  }

  // Get the member's user_id for the payments table
  const { data: member } = await adminDb
    .from('pool_members')
    .select('user_id')
    .eq('id', params.memberId)
    .eq('pool_id', params.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  // Update pool_members (keep backward compat)
  const updateData: Record<string, unknown> = {
    payment_status: status,
    payment_date: status === 'paid' ? new Date().toISOString() : null,
    payment_note: note || null,
  }

  const { error: memberError } = await adminDb
    .from('pool_members')
    .update(updateData)
    .eq('id', params.memberId)
    .eq('pool_id', params.id)

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  // Update payments table
  // Prefer updating bracket-specific records (created by trigger on submit).
  // Only fall back to null-bracket records or insert if none exist.
  const entryFee = Number(pool?.entry_fee) || 0
  const paymentUpdate = {
    status: status,
    payment_date: status === 'paid' ? new Date().toISOString() : null,
    payment_note: note || null,
    payment_method: 'manual',
    updated_at: new Date().toISOString(),
  }

  // If a specific bracket_id was given, update just that record
  if (bracket_id) {
    await adminDb.from('payments').update(paymentUpdate).eq('pool_id', params.id).eq('user_id', member.user_id).eq('bracket_id', bracket_id)
  } else {
    // No bracket_id — update ALL bracket-specific records for this user+pool
    const { data: bracketPayments } = await adminDb
      .from('payments')
      .select('id')
      .eq('pool_id', params.id)
      .eq('user_id', member.user_id)
      .not('bracket_id', 'is', null)

    if (bracketPayments && bracketPayments.length > 0) {
      // Update all bracket-specific records
      await adminDb.from('payments').update(paymentUpdate)
        .eq('pool_id', params.id)
        .eq('user_id', member.user_id)
        .not('bracket_id', 'is', null)
    } else {
      // No bracket records yet — fall back to null-bracket upsert (legacy)
      const { data: existingPayment } = await adminDb
        .from('payments').select('id').eq('pool_id', params.id).eq('user_id', member.user_id).is('bracket_id', null).maybeSingle()
      if (existingPayment) {
        await adminDb.from('payments').update({ ...paymentUpdate, amount: entryFee }).eq('id', existingPayment.id)
      } else {
        await adminDb.from('payments').insert({ pool_id: params.id, user_id: member.user_id, bracket_id: null, amount: entryFee, ...paymentUpdate })
      }
    }
  }

  // Notify commissioner when member marks pending_verification
  if (status === 'pending_verification' && !isCommissioner) {
    const { data: memberProfile } = await adminDb
      .from('profiles')
      .select('display_name')
      .eq('id', member.user_id)
      .single()
    const memberName = memberProfile?.display_name || 'A member'
    await notifyCommissioner(params.id, {
      type: 'payment_received',
      title: '💳 Payment submitted',
      message: `${memberName} says they've paid — confirm their payment`,
      action_url: `/pools/${params.id}/manage`,
    })
  }

  return NextResponse.json({ data: { ...updateData, id: params.memberId } })
}
