import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'

// POST /api/pools/join — join via invite code
export async function POST(request: Request) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { inviteCode } = await request.json()

  if (!inviteCode) {
    return NextResponse.json({ error: 'Invite code required' }, { status: 400 })
  }

  const { data: pool } = await supabase
    .from('pools')
    .select('id, name, status')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()

  if (!pool) {
    return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
  }

  if (pool.status === 'completed') {
    return NextResponse.json({ error: 'This pool has ended' }, { status: 400 })
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('pool_members')
    .select('id')
    .eq('pool_id', pool.id)
    .eq('user_id', session.user.id)
    .single()

  if (existing) {
    return NextResponse.json({ poolId: pool.id, alreadyMember: true })
  }

  const { error: joinError } = await supabase.from('pool_members').insert({
    pool_id: pool.id,
    user_id: session.user.id,
    role: 'member',
  })

  if (joinError) {
    return NextResponse.json({ error: joinError.message }, { status: 500 })
  }

  return NextResponse.json({ poolId: pool.id, poolName: pool.name })
}
