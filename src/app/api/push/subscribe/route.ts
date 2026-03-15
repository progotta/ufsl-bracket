import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint, keys } = await request.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  await supabase.from('push_subscriptions').upsert({
    user_id: session.user.id,
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
