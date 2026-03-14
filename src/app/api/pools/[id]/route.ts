import { createRouteClient } from '@/lib/supabase/route'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const poolId = params.id

  // Verify user is commissioner
  const { data: pool } = await supabase
    .from('pools')
    .select('commissioner_id')
    .eq('id', poolId)
    .single()

  if (!pool || pool.commissioner_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden — commissioner only' }, { status: 403 })
  }

  const body = await req.json()
  const allowedFields: Record<string, boolean> = { status: true, name: true, description: true }
  const updates: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(body)) {
    if (allowedFields[key]) {
      updates[key] = value
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // If locking, also set locked_at
  if (updates.status === 'locked') {
    updates.locked_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('pools')
    .update(updates)
    .eq('id', poolId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
