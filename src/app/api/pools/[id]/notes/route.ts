import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'
import { dispatchToPool } from '@/lib/notifications/dispatch'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  await supabase
    .from('pools')
    .update({ notes, notes_updated_at: new Date().toISOString() })
    .eq('id', params.id)

  // Notify all pool members (exclude the commissioner who just updated)
  if (notes?.trim()) {
    await dispatchToPool(params.id, 'pool_notes_updated', {
      title: `\ud83d\udccb ${pool?.name} \u2014 League update`,
      body: notes.length > 100 ? notes.substring(0, 97) + '\u2026' : notes,
      url: `/pools/${params.id}`,
    }, { excludeUserId: session.user.id })
  }

  return NextResponse.json({ success: true })
}
