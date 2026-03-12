import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'
import { sendNotification, sendBulkNotification, type NotificationType } from '@/lib/notifications'

// POST /api/notifications/send — internal use only (protect with secret)
export async function POST(request: Request) {
  // Verify internal secret to prevent public abuse
  const secret = request.headers.get('x-notification-secret')
  if (secret !== process.env.NOTIFICATION_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createRouteClient()
  const body = await request.json()
  const { userId, userIds, type, data = {} } = body

  if (!type) {
    return NextResponse.json({ error: 'type is required' }, { status: 400 })
  }

  try {
    if (userIds && Array.isArray(userIds)) {
      // Bulk send
      const result = await sendBulkNotification(supabase, userIds, type as NotificationType, data)
      return NextResponse.json(result)
    } else if (userId) {
      // Single user
      const result = await sendNotification(supabase, userId, type as NotificationType, data)
      return NextResponse.json(result)
    } else {
      return NextResponse.json({ error: 'userId or userIds required' }, { status: 400 })
    }
  } catch (err) {
    console.error('Send notification error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
