import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'

// GET /api/notifications/preferences
export async function GET() {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data, error } = await db
    .from('notification_preferences')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return defaults if no record exists
  const defaults = {
    game_alerts: true,
    upset_alerts: true,
    pool_updates: true,
    smack_mentions: true,
    marketing: false,
  }

  return NextResponse.json({ preferences: data || defaults })
}

// PUT /api/notifications/preferences
export async function PUT(request: Request) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { game_alerts, upset_alerts, pool_updates, smack_mentions, marketing } = body

  // Validate booleans
  const updates: Record<string, boolean | string> = { user_id: session.user.id, updated_at: new Date().toISOString() }
  if (typeof game_alerts === 'boolean') updates.game_alerts = game_alerts
  if (typeof upset_alerts === 'boolean') updates.upset_alerts = upset_alerts
  if (typeof pool_updates === 'boolean') updates.pool_updates = pool_updates
  if (typeof smack_mentions === 'boolean') updates.smack_mentions = smack_mentions
  if (typeof marketing === 'boolean') updates.marketing = marketing

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data, error } = await db
    .from('notification_preferences')
    .upsert(updates, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ preferences: data })
}
