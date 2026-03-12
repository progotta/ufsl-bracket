import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'

// POST /api/notifications/unsubscribe
export async function POST(request: Request) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { endpoint } = body

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  if (endpoint) {
    // Remove specific subscription
    const { error } = await db
      .from('push_subscriptions')
      .delete()
      .eq('user_id', session.user.id)
      .eq('endpoint', endpoint)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    // Remove all subscriptions for this user
    const { error } = await db
      .from('push_subscriptions')
      .delete()
      .eq('user_id', session.user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
