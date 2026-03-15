import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/ratelimit'

const MAX_SUBSCRIPTIONS_PER_USER = 10

// POST /api/notifications/subscribe
export async function POST(request: Request) {
  const supabase = createRouteClient()
  // M-3: Use getUser() for write operations (server-validated, not cookie-only)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // M-4: Rate limit subscribe requests — 10 per user per hour
  const rlResponse = await rateLimit(user.id, 'push-subscribe', { requests: 10, window: '1 h' })
  if (rlResponse) return rlResponse

  const body = await request.json()
  const { endpoint, keys } = body

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // M-4: Cap subscriptions at MAX_SUBSCRIPTIONS_PER_USER — delete oldest if exceeded
  const { data: existing } = await db
    .from('push_subscriptions')
    .select('id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (existing && existing.length >= MAX_SUBSCRIPTIONS_PER_USER) {
    const toDelete = existing.slice(0, existing.length - MAX_SUBSCRIPTIONS_PER_USER + 1)
    for (const sub of toDelete) {
      await db.from('push_subscriptions').delete().eq('id', sub.id)
    }
  }

  // Upsert subscription (unique on user_id + endpoint)
  const { error } = await db
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
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
      { user_id: user.id },
      { onConflict: 'user_id', ignoreDuplicates: true }
    )

  return NextResponse.json({ success: true })
}
