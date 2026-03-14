
import { createRouteClient } from '@/lib/supabase/route'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/pools/join — join via invite code
export async function POST(request: Request) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { inviteCode, referralId } = await request.json()

  if (!inviteCode) {
    return NextResponse.json({ error: 'Invite code required' }, { status: 400 })
  }

  // Use service role to look up pool by invite code — the invite code IS the access control.
  // RLS blocks non-members; a joiner isn't a member yet.
  const adminDb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: pool } = await adminDb
    .from('pools')
    .select('id, name, status, max_members, join_requires_approval')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()

  if (!pool) {
    return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
  }

  if (pool.status === 'completed') {
    return NextResponse.json({ error: 'This pool has ended' }, { status: 400 })
  }

  if (pool.status === 'locked') {
    return NextResponse.json({ error: 'This pool is locked — picks are closed' }, { status: 400 })
  }

  // Check if already a member
  const { data: existing } = await adminDb
    .from('pool_members')
    .select('id')
    .eq('pool_id', pool.id)
    .eq('user_id', session.user.id)
    .single()

  if (existing) {
    return NextResponse.json({ poolId: pool.id, alreadyMember: true })
  }

  // Check max members
  if (pool.max_members) {
    const { count } = await adminDb
      .from('pool_members')
      .select('id', { count: 'exact', head: true })
      .eq('pool_id', pool.id)

    if ((count ?? 0) >= pool.max_members) {
      return NextResponse.json({ error: 'This pool is full' }, { status: 400 })
    }
  }

  // Handle approval-required pools
  if (pool.join_requires_approval) {
    // Check if already requested
    const { data: existingRequest } = await adminDb
      .from('pool_join_requests')
      .select('id, status')
      .eq('pool_id', pool.id)
      .eq('user_id', session.user.id)
      .single()

    if (existingRequest) {
      return NextResponse.json({
        requiresApproval: true,
        requestStatus: existingRequest.status,
        poolId: pool.id,
      })
    }

    const { error: reqError } = await adminDb.from('pool_join_requests').insert({
      pool_id: pool.id,
      user_id: session.user.id,
      invite_code: inviteCode.toUpperCase(),
    })

    if (reqError) {
      return NextResponse.json({ error: reqError.message }, { status: 500 })
    }

    return NextResponse.json({ requiresApproval: true, requestStatus: 'pending', poolId: pool.id })
  }

  // Direct join
  const { error: joinError } = await adminDb.from('pool_members').insert({
    pool_id: pool.id,
    user_id: session.user.id,
    role: 'member',
  })

  if (joinError) {
    return NextResponse.json({ error: joinError.message }, { status: 500 })
  }

  // Mark referral as converted
  if (referralId) {
    await adminDb
      .from('referrals')
      .update({ referred_id: session.user.id, converted_at: new Date().toISOString() })
      .eq('id', referralId)
      .is('converted_at', null)
  } else {
    // Try to find and convert any pending referral for this invite code + user
    await adminDb
      .from('referrals')
      .update({ referred_id: session.user.id, converted_at: new Date().toISOString() })
      .eq('invite_code', inviteCode.toUpperCase())
      .is('referred_id', null)
      .is('converted_at', null)
      .limit(1)
  }

  return NextResponse.json({ poolId: pool.id, poolName: pool.name })
}
