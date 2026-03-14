import { createRouteClient } from '@/lib/supabase/route'
import { createReadClient } from '@/lib/supabase/server'
import { notifyCommissioner } from '@/lib/notify'
import { NextResponse } from 'next/server'

// POST — notify commissioner when a member submits their bracket
export async function POST(
  _req: Request,
  { params }: { params: { bracketId: string } }
) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminDb = createReadClient()

  const { data: bracket } = await adminDb
    .from('brackets')
    .select('pool_id, user_id, name')
    .eq('id', params.bracketId)
    .single()

  if (!bracket || bracket.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: profile } = await adminDb
    .from('profiles')
    .select('display_name')
    .eq('id', session.user.id)
    .single()

  const memberName = profile?.display_name || 'A member'

  await notifyCommissioner(bracket.pool_id, {
    type: 'bracket_submitted',
    title: '🎯 Bracket submitted',
    message: `${memberName} just submitted their bracket`,
    action_url: `/pools/${bracket.pool_id}/manage`,
  })

  return NextResponse.json({ ok: true })
}
