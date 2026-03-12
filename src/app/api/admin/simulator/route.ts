/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRouteClient } from '@/lib/supabase/route'
import { requireAdmin } from '@/lib/adminAuth'
import { NextResponse } from 'next/server'

// GET: fetch sim config + games with team info
export async function GET() {
  const authError = await requireAdmin()
  if (authError) return authError

  const supabase = createRouteClient()
  const db = supabase as any

  const [configResult, gamesResult] = await Promise.all([
    db.from('simulation_config').select('*').limit(1).single(),
    db.from('games').select(`
      *,
      team1:team1_id(id, name, abbreviation, seed, region),
      team2:team2_id(id, name, abbreviation, seed, region),
      winner:winner_id(id, name, abbreviation, seed)
    `).order('round').order('game_number'),
  ])

  return NextResponse.json({
    config: configResult.data,
    games: gamesResult.data || [],
  })
}

// PATCH: update simulation config
export async function PATCH(request: Request) {
  const authError = await requireAdmin()
  if (authError) return authError

  const supabase = createRouteClient()
  const db = supabase as any
  const body = await request.json()

  // Get the config row id first
  const { data: config } = await db.from('simulation_config').select('id').limit(1).single()
  if (!config) {
    return NextResponse.json({ error: 'No simulation config found' }, { status: 404 })
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (body.is_simulation_mode !== undefined) updates.is_simulation_mode = body.is_simulation_mode
  if (body.time_multiplier !== undefined) updates.time_multiplier = body.time_multiplier
  if (body.current_simulated_date !== undefined) updates.current_simulated_date = body.current_simulated_date

  const { error } = await db.from('simulation_config').update(updates).eq('id', config.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
