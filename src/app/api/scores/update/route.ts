/**
 * Manual score update endpoint for commissioners.
 * Allows updating live scores on in-progress games without completing them.
 * This feeds our /api/scores/live fallback (database source).
 */
import { NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route'

export async function POST(request: Request) {
  const supabase = createRouteClient()
  const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { gameId, team1Score, team2Score, status, clock } = body

  if (!gameId) {
    return NextResponse.json({ error: 'Missing gameId' }, { status: 400 })
  }

  // Only allow commissioners or admins to update scores
  // For now we check if the user is a commissioner of any pool — simple access control
  const { data: membership } = await db
    .from('pool_members')
    .select('role')
    .eq('user_id', session.user.id)
    .eq('role', 'commissioner')
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden — commissioners only' }, { status: 403 })
  }

  const updates: Record<string, unknown> = {}
  if (team1Score !== undefined) updates.team1_score = team1Score
  if (team2Score !== undefined) updates.team2_score = team2Score
  if (status) updates.status = status
  // clock is a UI-only display field — we don't persist it to DB currently

  const { error } = await db
    .from('games')
    .update(updates)
    .eq('id', gameId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
