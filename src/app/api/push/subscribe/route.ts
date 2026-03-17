import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/ratelimit'

const MAX_SUBSCRIPTIONS_PER_USER = 10

export async function POST(request: Request) {
  const supabase = createRouteClient()
  // M-3: Use getUser() for write operations
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // M-4: Rate limit subscribe requests — 10 per user per hour
  const rlResponse = await rateLimit(user.id, 'push-subscribe', { requests: 10, window: '1 h' })
  if (rlResponse) return rlResponse

  const { endpoint, keys } = await request.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  // M-4: Cap subscriptions at MAX_SUBSCRIPTIONS_PER_USER — delete oldest if exceeded
  const { data: existing } = await supabase
    .from('push_subscriptions')
    .select('id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (existing && existing.length >= MAX_SUBSCRIPTIONS_PER_USER) {
    const toDelete = existing.slice(0, existing.length - MAX_SUBSCRIPTIONS_PER_USER + 1)
    for (const sub of toDelete) {
      await supabase.from('push_subscriptions').delete().eq('id', sub.id)
    }
  }

  await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint,
    keys: { p256dh: keys.p256dh, auth: keys.auth },
  }, { onConflict: 'user_id,endpoint' })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = await request.json()
  await supabase.from('push_subscriptions')
    .delete()
    .eq('user_id', session.user.id)
    .eq('endpoint', endpoint)

  return NextResponse.json({ success: true })
}
