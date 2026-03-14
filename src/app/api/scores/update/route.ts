/**
 * Manual score update endpoint for commissioners.
 * Allows updating live scores on in-progress games without completing them.
 * This feeds our /api/scores/live fallback (database source).
 */
import { NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route'
import { requireAdmin } from '@/lib/adminAuth'
import { invalidateCache } from '@/lib/cache'

export async function POST(request: Request) {
  // Score updates affect all pools globally — require admin, not just any commissioner
  const authError = await requireAdmin()
  if (authError) return authError

  const supabase = createRouteClient()
  const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any

  const body = await request.json()
  const { gameId, team1Score, team2Score, status, clock } = body

  if (!gameId) {
    return NextResponse.json({ error: 'Missing gameId' }, { status: 400 })
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

  // Invalidate live scores and leaderboard caches on score update
  await invalidateCache('live-scores', 'leaderboard:global:all-time', 'leaderboard:global:this-round', 'leaderboard:global:today')

  return NextResponse.json({ success: true })
}
