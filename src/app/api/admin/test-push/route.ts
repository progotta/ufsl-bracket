import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'
import { dispatch } from '@/lib/notifications/dispatch'
import { requireAdmin } from '@/lib/adminAuth'

export async function POST(request: Request) {
  const authError = await requireAdmin()
  if (authError) return authError

  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, body } = await request.json().catch(() => ({}))

  await dispatch(session.user.id, 'round_complete', {
    title: title || '\ud83d\udd14 Test Notification',
    body: body || 'Push notifications are working! \u2014 UFSL Simulator',
    url: '/dashboard',
  })

  return NextResponse.json({ success: true })
}
