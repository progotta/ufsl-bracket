import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/ratelimit'

// GET /api/smack?pool_id=xxx[&before=<iso>&limit=20]
// Read-only: getSession() is fine for performance
export async function GET(request: Request) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const poolId = searchParams.get('pool_id')
  const before = searchParams.get('before')
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100)

  if (!poolId) return NextResponse.json({ error: 'pool_id required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Verify pool membership (or commissioner access)
  const { data: memberCheck } = await db
    .from('pool_members')
    .select('id')
    .eq('pool_id', poolId)
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (!memberCheck) {
    const { data: poolCheck } = await db
      .from('pools')
      .select('commissioner_id')
      .eq('id', poolId)
      .single()
    if (poolCheck?.commissioner_id !== session.user.id) {
      return NextResponse.json({ error: 'Not a pool member' }, { status: 403 })
    }
  }

  let query = db
    .from('smack_messages')
    .select(`
      id,
      pool_id,
      user_id,
      message,
      created_at,
      reactions,
      profiles(display_name, avatar_url)
    `)
    .eq('pool_id', poolId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (before) {
    query = query.lt('created_at', before)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return in chronological order (oldest first) for rendering
  const messages = (data || []).reverse()
  return NextResponse.json({ messages, hasMore: data?.length === limit })
}

// POST /api/smack — create a message
export async function POST(request: Request) {
  const supabase = createRouteClient()
  // M-3: Use getUser() for write operations (server-validated, not cookie-only)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit: 20 requests per minute per user
  const rlResponse = await rateLimit(user.id, 'smack-post', { requests: 20, window: '1 m' })
  if (rlResponse) return rlResponse

  const { pool_id, message } = await request.json()
  if (!pool_id || !message?.trim()) {
    return NextResponse.json({ error: 'pool_id and message required' }, { status: 400 })
  }
  if (message.length > 280) {
    return NextResponse.json({ error: 'Message exceeds 280 characters' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Verify membership
  const { data: membership } = await db
    .from('pool_members')
    .select('id')
    .eq('pool_id', pool_id)
    .eq('user_id', user.id)
    .maybeSingle()

  // Commissioners can also post (they may not be in pool_members)
  const { data: pool } = await db
    .from('pools')
    .select('commissioner_id')
    .eq('id', pool_id)
    .single()

  const isCommissioner = pool?.commissioner_id === user.id

  if (!membership && !isCommissioner) {
    return NextResponse.json({ error: 'You are not a member of this pool' }, { status: 403 })
  }

  const { data: msg, error } = await db
    .from('smack_messages')
    .insert({
      pool_id,
      user_id: user.id,
      message: message.trim(),
      reactions: {},
    })
    .select(`
      id,
      pool_id,
      user_id,
      message,
      created_at,
      reactions,
      profiles(display_name, avatar_url)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ message: msg }, { status: 201 })
}
