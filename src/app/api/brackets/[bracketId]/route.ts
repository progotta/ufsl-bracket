import { createRouteClient } from '@/lib/supabase/route'
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// DELETE /api/brackets/[bracketId]
// Deletes a bracket only if it has no paid/pending/waived payment record.
export async function DELETE(
  _req: Request,
  { params }: { params: { bracketId: string } }
) {
  try {
    const supabase = createRouteClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminDb = createServiceClient()

    // Verify bracket belongs to this user
    const { data: bracket } = await adminDb
      .from('brackets')
      .select('id, user_id, pool_id')
      .eq('id', params.bracketId)
      .single()

    if (!bracket) return NextResponse.json({ error: 'Bracket not found' }, { status: 404 })
    if (bracket.user_id !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Check for a payment record that would block deletion
    const { data: payment } = await adminDb
      .from('payments')
      .select('id, status')
      .eq('bracket_id', params.bracketId)
      .single()

    if (payment && ['paid', 'pending_verification', 'waived'].includes(payment.status)) {
      return NextResponse.json(
        { error: 'Cannot delete a bracket that has already been paid for. Contact your commissioner.' },
        { status: 409 }
      )
    }

    // Delete the unpaid payment record before deleting the bracket
    // (FK is SET NULL, so it would orphan rather than cascade — clean it up explicitly)
    if (payment) {
      await adminDb.from('payments').delete().eq('id', payment.id)
    }

    const { error } = await adminDb.from('brackets').delete().eq('id', params.bracketId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/brackets/:id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
