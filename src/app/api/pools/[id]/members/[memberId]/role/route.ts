import { createRouteClient } from '@/lib/supabase/route'
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  const supabase = createRouteClient()
  // M-3: Use getUser() for write operations (server-validated, not cookie-only)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role } = await request.json()
  if (!['commissioner', 'member'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  // Only the pool OWNER (commissioner_id) can assign/remove co-commissioners
  const adminDb = createServiceClient()
  const { data: pool } = await adminDb.from('pools').select('commissioner_id').eq('id', params.id).single()
  if (!pool || pool.commissioner_id !== user.id) {
    return NextResponse.json({ error: 'Only the pool owner can assign roles' }, { status: 403 })
  }

  // Can't demote the owner themselves
  const { data: member } = await adminDb.from('pool_members').select('user_id').eq('id', params.memberId).single()
  if (member?.user_id === pool.commissioner_id) {
    return NextResponse.json({ error: 'Cannot change the pool owner role' }, { status: 400 })
  }

  const { error } = await adminDb
    .from('pool_members')
    .update({ role })
    .eq('id', params.memberId)
    .eq('pool_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, role })
}
