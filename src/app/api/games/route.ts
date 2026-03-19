/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'
import { ROUND_POINTS } from '@/lib/bracket'
import { requireAdmin } from '@/lib/adminAuth'
import { getCached, invalidateCache } from '@/lib/cache'

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

  // Batch recalculate scores — single SQL UPDATE via RPC instead of N+1 loop
  // Picks are stored by slug (e.g. "east-r1-g2"), not UUID — derive it from game fields
  const regionSlug = (game.region as string || '').toLowerCase()
  const gameSlug = `${regionSlug}-r${game.round}-g${game.game_number}`
  const roundPoints = ROUND_POINTS[game.round as number] || 1
  const { error: rpcError } = await db.rpc('recalculate_scores_for_game', {
    p_game_id: gameSlug,
    p_winner_id: winnerId,
    p_round_points: roundPoints,
  })

  if (rpcError) {
    console.error('[games POST] RPC recalculate_scores_for_game error:', rpcError)
  }

  // Recalculate max_possible_score for all brackets (loser's picks are now dead)
  const loserId = game.team1_id === winnerId ? game.team2_id : game.team1_id
  const { error: maxError } = await db.rpc('recalculate_max_possible_for_game', {
    p_loser_id: loserId,
  })
  if (maxError) {
    console.error('[games POST] RPC recalculate_max_possible_for_game error:', maxError)
  }

  // Invalidate games cache after result update
  await invalidateCache('games:all')

  return NextResponse.json({ success: true })
}

export async function GET() {
  const supabase = createRouteClient()
  const db = supabase as any

  const games = await getCached('games:all', async () => {
    const { data } = await db
      .from('games')
      .select('*')
      .order('round')
      .order('game_number')
    return data || []
  }, 30)

  return NextResponse.json({ games })
}
