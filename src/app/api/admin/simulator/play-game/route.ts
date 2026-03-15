/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRouteClient } from '@/lib/supabase/route'
import { requireAdmin } from '@/lib/adminAuth'
import { NextResponse } from 'next/server'
import { simulateGame } from '@/lib/simulator'

function getGameSlug(gameNumber: number, round: number, region: string): string {
  if (round === 6) return 'championship-r6-g1'
  if (round === 5) return `ff-r5-g${gameNumber === 61 ? 1 : 2}`
  const gamesPerRound: Record<number, number> = { 1: 8, 2: 4, 3: 2, 4: 1 }
  const withinRound = ((gameNumber - 1) % (gamesPerRound[round] || 1)) + 1
  return `${region.toLowerCase()}-r${round}-g${withinRound}`
}
import { ROUND_POINTS } from '@/lib/bracket'
import { advanceWinner } from '@/lib/bracketAdvancement'

export async function POST(request: Request) {
  try {
  const authError = await requireAdmin()
  if (authError) return authError

  const supabase = createRouteClient()
  const db = supabase as any
  const { gameId, useActual } = await request.json().catch(() => ({} as any))

  if (!gameId) {
    return NextResponse.json({ error: 'gameId required' }, { status: 400 })
  }

  const { data: game } = await db.from('games').select(`
    *,
    team1:team1_id(id, name, abbreviation, seed),
    team2:team2_id(id, name, abbreviation, seed)
  `).eq('id', gameId).single()

  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  if (game.status === 'completed') return NextResponse.json({ error: 'Game already completed' }, { status: 400 })
  if (!game.team1 || !game.team2) return NextResponse.json({ error: 'Teams not set for this game' }, { status: 400 })

  const result = simulateGame(game, useActual === true)

  const { error } = await db.from('games').update({
    winner_id: result.winnerId,
    team1_score: result.team1Score,
    team2_score: result.team2Score,
    status: 'completed',
    completed_at: new Date().toISOString(),
  }).eq('id', gameId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Advance winner to next bracket slot
  await advanceWinner(db, game.game_number, result.winnerId)

  // Update bracket scores — check both slug-keyed (real users) and UUID-keyed (legacy)
  const { data: brackets } = await db.from('brackets').select('id, picks, score, correct_picks')
  if (brackets) {
    const points = ROUND_POINTS[game.round] || 1
    const slug = getGameSlug(game.game_number, game.round, game.region)
    for (const bracket of brackets) {
      const picks = (bracket.picks || {}) as Record<string, string>
      const pickedWinner = picks[slug] || picks[gameId]
      if (pickedWinner === result.winnerId) {
        await db.from('brackets').update({
          score: (bracket.score || 0) + points,
          correct_picks: (bracket.correct_picks || 0) + 1,
        }).eq('id', bracket.id)
      }
    }
  }

  return NextResponse.json({ success: true, result })
  } catch (err) {
    console.error('[simulator/play-game]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
