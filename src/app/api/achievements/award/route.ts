import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/achievements/award
 * Service-role only endpoint to award an achievement to a user.
 *
 * Body: { userId: string, achievementKey: string, bracketId?: string, metadata?: Record<string, unknown> }
 *
 * Requires x-service-key header matching SUPABASE_SERVICE_ROLE_KEY.
 */
export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const authHeader = req.headers.get('x-service-key')
  if (authHeader !== serviceKey) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: {
    userId: string
    achievementKey: string
    bracketId?: string
    metadata?: Record<string, unknown>
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { userId, achievementKey, bracketId, metadata = {} } = body
  if (!userId || !achievementKey) {
    return NextResponse.json({ error: 'userId and achievementKey required' }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Verify achievement exists
  const { data: achievement, error: achErr } = await supabase
    .from('achievements')
    .select('*')
    .eq('id', achievementKey)
    .maybeSingle()

  if (achErr || !achievement) {
    return NextResponse.json({ error: 'Achievement not found' }, { status: 404 })
  }

  // Insert (idempotent via unique constraint)
  const { error: insertErr } = await supabase
    .from('user_achievements')
    .upsert(
      {
        user_id: userId,
        achievement_id: achievementKey,
        bracket_id: bracketId ?? null,
        metadata,
      },
      { onConflict: 'user_id,achievement_id', ignoreDuplicates: true }
    )

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  // Recalculate user XP
  const { error: rpcErr } = await supabase.rpc('recalculate_user_xp', { p_user_id: userId })
  if (rpcErr) {
    console.error('[award] recalculate_user_xp error:', rpcErr)
  }

  return NextResponse.json({ success: true, achievement })
}
