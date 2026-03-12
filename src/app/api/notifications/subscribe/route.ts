import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'

// POST /api/notifications/subscribe
export async function POST(request: Request) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { endpoint, keys } = body

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Upsert subscription (unique on user_id + endpoint)
  const { error } = await db
    .from('push_subscriptions')
    .upsert(
      {
        user_id: session.user.id,
        endpoint,
        keys,
        last_used: new Date().toISOString(),
      },
      { onConflict: 'user_id,endpoint' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Initialize preferences if not exists
  await db
    .from('notification_preferences')
    .upsert(
      { user_id: session.user.id },
      { onConflict: 'user_id', ignoreDuplicates: true }
    )

  return NextResponse.json({ success: true })
}
