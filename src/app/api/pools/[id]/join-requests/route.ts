/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'

// GET /api/pools/[id]/join-requests — list pending requests (commissioner only)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabase as any

  // Verify commissioner
  const { data: pool } = await db
    .from('pools')
    .select('commissioner_id')
    .eq('id', params.id)
    .single()

  if (!pool || pool.commissioner_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: requests, error } = await db
    .from('pool_join_requests')
    .select('*, profiles(display_name, avatar_url)')
    .eq('pool_id', params.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ requests: requests || [] })
}

// POST /api/pools/[id]/join-requests — approve or deny a request
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { requestId, action } = await request.json()

  if (!requestId || !['approve', 'deny'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const db = supabase as any

  // Verify commissioner
  const { data: pool } = await db
    .from('pools')
    .select('commissioner_id')
    .eq('id', params.id)
    .single()

  if (!pool || pool.commissioner_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get the request
  const { data: joinRequest } = await db
    .from('pool_join_requests')
    .select('user_id')
    .eq('id', requestId)
    .eq('pool_id', params.id)
    .single()

  if (!joinRequest) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  const status = action === 'approve' ? 'approved' : 'denied'

  // Update request status
  await db
    .from('pool_join_requests')
    .update({ status, resolved_at: new Date().toISOString() })
    .eq('id', requestId)

  // If approved, add to pool_members
  if (action === 'approve') {
    const { error: memberError } = await db.from('pool_members').insert({
      pool_id: params.id,
      user_id: joinRequest.user_id,
      role: 'member',
    })

    if (memberError && memberError.code !== '23505') { // ignore duplicate
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true, action })
}
