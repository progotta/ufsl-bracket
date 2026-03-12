/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRouteClient } from '@/lib/supabase/route'
import { requireAdmin } from '@/lib/adminAuth'
import { NextResponse } from 'next/server'

export async function POST() {
  const authError = await requireAdmin()
  if (authError) return authError

  const supabase = createRouteClient()
  const db = supabase as any

  // Reset all games to scheduled state
  const { error } = await db.from('games').update({
    winner_id: null,
    team1_score: null,
    team2_score: null,
    status: 'scheduled',
    completed_at: null,
  }).neq('id', '00000000-0000-0000-0000-000000000000') // matches all rows

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Reset bracket scores
  await db.from('brackets').update({ score: 0 }).neq('id', '00000000-0000-0000-0000-000000000000')

  // Reset simulated date
  const { data: config } = await db.from('simulation_config').select('id').limit(1).single()
  if (config) {
    await db.from('simulation_config').update({
      current_simulated_date: '2025-03-20',
      updated_at: new Date().toISOString(),
    }).eq('id', config.id)
  }

  return NextResponse.json({ success: true })
}
