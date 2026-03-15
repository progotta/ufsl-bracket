import { createRouteClient } from '@/lib/supabase/route'
import { createReadClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { dispatchToPool } from '@/lib/notifications/dispatch'
import { rateLimit } from '@/lib/ratelimit'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit: 5 notes updates per pool per hour
  const rlKey = `${session.user.id}:${params.id}`
  const rlResponse = await rateLimit(rlKey, 'notes-update', { requests: 5, window: '1 h' })
  if (rlResponse) return rlResponse

  // Must be commissioner or co-commissioner
  const { data: pool } = await supabase
    .from('pools')
    .select('commissioner_id, name')
    .eq('id', params.id)
    .single()

  const { data: member } = await supabase
    .from('pool_members')
    .select('role')
    .eq('pool_id', params.id)
    .eq('user_id', session.user.id)
    .single()

  const isCommissioner = pool?.commissioner_id === session.user.id || member?.role === 'commissioner'
  if (!isCommissioner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { notes } = await request.json()

  // Validate notes length
  if (notes && notes.length > 2000) {
    return NextResponse.json({ error: 'Notes too long (max 2000 characters)' }, { status: 400 })
  }

  // Use service role client to bypass RLS (co-commissioner case)
  const serviceDb = createReadClient()
  await serviceDb
    .from('pools')
    .update({ notes, notes_updated_at: new Date().toISOString() })
    .eq('id', params.id)

  // Notify all pool members (exclude the commissioner who just updated)
  if (notes?.trim()) {
    await dispatchToPool(params.id, 'pool_notes_updated', {
      title: `📋 ${pool?.name} — League update`,
      body: notes.length > 100 ? notes.substring(0, 97) + '…' : notes,
      url: `/pools/${params.id}`,
    }, { excludeUserId: session.user.id })
  }

  return NextResponse.json({ success: true })
}
