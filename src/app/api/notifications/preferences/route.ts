import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'
import { NotificationType } from '@/lib/notifications/types'

// GET — fetch all preferences for current user
export async function GET() {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data } = await db
    .from('notification_preferences')
    .select('*')
    .eq('user_id', session.user.id)

  return NextResponse.json({ preferences: data || [] })
}

// PATCH — upsert one preference
export async function PATCH(request: Request) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, push_enabled, email_enabled, sms_enabled } = await request.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { error } = await db.from('notification_preferences').upsert({
    user_id: session.user.id,
    type: type as NotificationType,
    push_enabled: push_enabled ?? true,
    email_enabled: email_enabled ?? false,
    sms_enabled: sms_enabled ?? false,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,type' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
