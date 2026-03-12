/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRouteClient } from '@/lib/supabase/route'
import { requireAdmin } from '@/lib/adminAuth'
import { NextResponse } from 'next/server'
import { simulateGame } from '@/lib/simulator'
import { ROUND_POINTS } from '@/lib/bracket'

export async function POST(request: Request) {
  const authError = await requireAdmin()
  if (authError) return authError

  const supabase = createRouteClient()
  const db = supabase as any
  const body = await request.json().catch(() => ({}))
  const useActual = body.useActual === true

  // Get all games with team info
  const { data: games } = await db.from('games').select(`
    *,
    team1:team1_id(id, name, abbreviation, seed),
    team2:team2_id(id, name, abbreviation, seed)
  `).order('round').order('game_number')

  if (!games || games.length === 0) {
    return NextResponse.json({ error: 'No games found' }, { status: 404 })
  }

  // Find next unplayed round
  const nextRound = findNextUnplayedRound(games)
  if (!nextRound) {
    return NextResponse.json({ error: 'All rounds complete', roundPlayed: null })
  }

  // Get games in that round that are ready to play (have both teams)
  const roundGames = games.filter((g: any) =>
    g.round === nextRound &&
    g.status !== 'completed' &&
    g.team1 &&
    g.team2
  )

  if (roundGames.length === 0) {
    return NextResponse.json({ error: 'No playable games in next round', roundPlayed: null })
  }

  const played: string[] = []
  const errors: string[] = []

  for (const game of roundGames) {
    const result = simulateGame(game, useActual)
    const { error } = await db.from('games').update({
      winner_id: result.winnerId,
      team1_score: result.team1Score,
      team2_score: result.team2Score,
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', game.id)

    if (error) {
      errors.push(`Game ${game.game_number}: ${error.message}`)
    } else {
      played.push(game.id)
      // Update bracket scores
      await updateBracketScores(db, game.id, result.winnerId, game.round)
    }
  }

  // Advance simulated date by 1 day after playing a round
  const { data: config } = await db.from('simulation_config').select('*').limit(1).single()
  if (config?.current_simulated_date) {
    const d = new Date(config.current_simulated_date)
    d.setDate(d.getDate() + 1)
    await db.from('simulation_config').update({
      current_simulated_date: d.toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    }).eq('id', config.id)
  }

  return NextResponse.json({
    success: true,
    roundPlayed: nextRound,
    gamesPlayed: played.length,
    errors,
  })
}

function findNextUnplayedRound(games: any[]): number | null {
  for (let round = 1; round <= 6; round++) {
    const roundGames = games.filter((g: any) => g.round === round)
    if (roundGames.length === 0) continue
    const hasUnplayed = roundGames.some((g: any) => g.status !== 'completed')
    if (hasUnplayed) return round
  }
  return null
}

async function updateBracketScores(db: any, gameId: string, winnerId: string, round: number) {
  const { data: brackets } = await db.from('brackets').select('id, picks, score')
  if (!brackets) return
  const points = ROUND_POINTS[round] || 1
  for (const bracket of brackets) {
    const picks = (bracket.picks || {}) as Record<string, string>
    if (picks[gameId] === winnerId) {
      await db.from('brackets').update({ score: (bracket.score || 0) + points }).eq('id', bracket.id)
    }
  }
}
