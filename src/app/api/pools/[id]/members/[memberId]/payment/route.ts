import { createRouteClient } from '@/lib/supabase/route'
import { createReadClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check that user is commissioner of this pool
  const adminDb = createReadClient()
  const { data: pool } = await adminDb
    .from('pools')
    .select('commissioner_id')
    .eq('id', params.id)
    .single()

  const body = await req.json()
  const { status, note } = body

  const isCommissioner = pool?.commissioner_id === session.user.id

  // Members can only set pending_verification on their own record
  if (!isCommissioner) {
    if (status !== 'pending_verification') {
      return NextResponse.json({ error: 'Only the commissioner can update payment status' }, { status: 403 })
    }
    // Verify this member record belongs to the requesting user
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

  const updateData: Record<string, unknown> = {
    payment_status: status,
    payment_date: status === 'paid' ? new Date().toISOString() : null,
    payment_note: note || null,
  }

  const { data: updated, error } = await adminDb
    .from('pool_members')
    .update(updateData)
    .eq('id', params.memberId)
    .eq('pool_id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: updated })
}
