/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'
import { ROUND_POINTS } from '@/lib/bracket'
import { requireAdmin } from '@/lib/adminAuth'

export async function POST(request: Request) {
  const authError = await requireAdmin()
  if (authError) return authError

  const supabase = createRouteClient()

  const { gameId, winnerId, team1Score, team2Score } = await request.json()

  if (!gameId || !winnerId) {
    return NextResponse.json({ error: 'Missing gameId or winnerId' }, { status: 400 })
  }

  // Get the game — using any to bypass strict typing on joins/updates
  const db = supabase as any
  const { data: game, error: gameError } = await db
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single()

  if (gameError || !game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  // Update the game result
  const { error: updateError } = await db
    .from('games')
    .update({
      winner_id: winnerId,
      team1_score: team1Score ?? null,
      team2_score: team2Score ?? null,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', gameId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Recalculate scores for all brackets that have a pick for this game
  const { data: brackets } = await db
    .from('brackets')
    .select('id, picks, score')

  if (brackets && brackets.length > 0) {
    const roundPoints = ROUND_POINTS[game.round as number] || 1

    for (const bracket of brackets) {
      const picks = (bracket.picks || {}) as Record<string, string>
      if (!picks[gameId]) continue

      const isCorrect = picks[gameId] === winnerId
      if (isCorrect) {
        await db
          .from('brackets')
          .update({ score: (bracket.score || 0) + roundPoints })
          .eq('id', bracket.id)
      }
    }
  }

  return NextResponse.json({ success: true })
}

export async function GET() {
  const supabase = createRouteClient()
  const db = supabase as any

  const { data: games } = await db
    .from('games')
    .select('*')
    .order('round')
    .order('game_number')

  return NextResponse.json({ games: games || [] })
}
