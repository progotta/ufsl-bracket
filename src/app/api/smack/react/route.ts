import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'

const ALLOWED_REACTIONS = ['🔥', '💀', '😂', '🗑️']

// POST /api/smack/react — toggle a reaction on a message
// Body: { message_id: string, emoji: string }
export async function POST(request: Request) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message_id, emoji } = await request.json()

  if (!message_id || !emoji) {
    return NextResponse.json({ error: 'message_id and emoji required' }, { status: 400 })
  }
  if (!ALLOWED_REACTIONS.includes(emoji)) {
    return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Fetch the current message + reactions
  const { data: msg, error: fetchErr } = await db
    .from('smack_messages')
    .select('id, pool_id, reactions')
    .eq('id', message_id)
    .single()

  if (fetchErr || !msg) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  }

  // Verify current user is a pool member or commissioner
  const { data: membership } = await db
    .from('pool_members')
    .select('id')
    .eq('pool_id', msg.pool_id)
    .eq('user_id', session.user.id)
    .maybeSingle()

  const { data: pool } = await db
    .from('pools')
    .select('commissioner_id')
    .eq('id', msg.pool_id)
    .single()

  if (!membership && pool?.commissioner_id !== session.user.id) {
    return NextResponse.json({ error: 'Not a pool member' }, { status: 403 })
  }

  // Toggle: reactions[emoji] = array of user IDs
  const reactions: Record<string, string[]> = msg.reactions || {}
  const current = reactions[emoji] || []
  const userId = session.user.id

  if (current.includes(userId)) {
    // Remove reaction
    reactions[emoji] = current.filter((id: string) => id !== userId)
    if (reactions[emoji].length === 0) delete reactions[emoji]
  } else {
    // Add reaction
    reactions[emoji] = [...current, userId]
  }

  const { data: updated, error: updateErr } = await db
    .from('smack_messages')
    .update({ reactions })
    .eq('id', message_id)
    .select('id, reactions')
    .single()

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ reactions: updated.reactions })
}
