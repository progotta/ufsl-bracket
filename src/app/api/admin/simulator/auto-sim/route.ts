/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRouteClient } from '@/lib/supabase/route'
import { requireAdmin } from '@/lib/adminAuth'
import { NextResponse } from 'next/server'
import { ACTUAL_2025_RESULTS } from '@/lib/simulator'
import { ROUND_POINTS } from '@/lib/bracket'

export async function POST() {
  try {
  const authError = await requireAdmin()
  if (authError) return authError

  const supabase = createRouteClient()
  const db = supabase as any

  // Get all games
  const { data: games } = await db.from('games').select('*').order('round').order('game_number')
  if (!games) return NextResponse.json({ error: 'No games found' }, { status: 404 })

  let applied = 0
  const errors: string[] = []

  for (const game of games) {
    const result = ACTUAL_2025_RESULTS[game.id]
    if (!result) continue

    const { error } = await db.from('games').update({
      winner_id: result.winnerId,
      team1_score: result.team1Score,
      team2_score: result.team2Score,
      status: 'completed',
      completed_at: result.completedAt || new Date().toISOString(),
    }).eq('id', game.id)

    if (error) {
      errors.push(`Game ${game.id}: ${error.message}`)
    } else {
      applied++
    }
  }

  // Recalculate all bracket scores from scratch — batch upsert instead of N sequential updates
  const { data: brackets } = await db.from('brackets').select('id, picks')
  if (brackets) {
    const updates: { id: string; score: number }[] = []
    for (const bracket of brackets) {
      const picks = (bracket.picks || {}) as Record<string, string>
      let score = 0
      for (const game of games) {
        const result = ACTUAL_2025_RESULTS[game.id]
        if (result && picks[game.id] === result.winnerId) {
          score += ROUND_POINTS[game.round] || 1
        }
      }
      updates.push({ id: bracket.id, score })
    }
    if (updates.length > 0) {
      await db.from('brackets').upsert(updates, { onConflict: 'id' })
    }
  }

  // Set simulated date to championship date
  const { data: config } = await db.from('simulation_config').select('id').limit(1).single()
  if (config) {
    await db.from('simulation_config').update({
      current_simulated_date: '2025-04-07',
      updated_at: new Date().toISOString(),
    }).eq('id', config.id)
  }

  return NextResponse.json({ success: true, gamesApplied: applied, errors })
  } catch (err) {
    console.error('[simulator/auto-sim]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
