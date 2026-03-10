import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'
import { ROUND_POINTS } from '@/lib/bracket'

export async function POST(request: Request) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { gameId, winnerId, team1Score, team2Score } = await request.json()

  if (!gameId || !winnerId) {
    return NextResponse.json({ error: 'Missing gameId or winnerId' }, { status: 400 })
  }

  // Get the game
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single()

  if (gameError || !game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  // Update the game result
  const { error: updateError } = await supabase
    .from('games')
    .update({
      winner_id: winnerId,
      team1_score: team1Score,
      team2_score: team2Score,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', gameId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Recalculate scores for all brackets that have a pick for this game
  const { data: brackets } = await supabase
    .from('brackets')
    .select('id, picks, score, max_possible_score')

  if (brackets) {
    for (const bracket of brackets) {
      const picks = bracket.picks as Record<string, string>
      if (!picks[gameId]) continue

      const isCorrect = picks[gameId] === winnerId
      const roundPoints = ROUND_POINTS[game.round] || 1

      // Increment score if correct
      if (isCorrect) {
        await supabase
          .from('brackets')
          .update({ score: (bracket.score || 0) + roundPoints })
          .eq('id', bracket.id)
      }

      // Update max possible score (reduce if their pick is eliminated)
      // This is a simplified calculation — a full implementation would
      // trace all downstream games
    }
  }

  return NextResponse.json({ success: true })
}

export async function GET(request: Request) {
  const supabase = createRouteClient()
  
  const { data: games } = await supabase
    .from('games')
    .select('*, team1:team1_id(*), team2:team2_id(*), winner:winner_id(*)')
    .order('round')
    .order('game_number')

  return NextResponse.json({ games })
}
