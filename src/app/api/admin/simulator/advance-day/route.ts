/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRouteClient } from '@/lib/supabase/route'
import { requireAdmin } from '@/lib/adminAuth'
import { NextResponse } from 'next/server'

export async function POST() {
  const authError = await requireAdmin()
  if (authError) return authError

  const supabase = createRouteClient()
  const db = supabase as any

  const { data: config } = await db.from('simulation_config').select('*').limit(1).single()
  if (!config) return NextResponse.json({ error: 'No config found' }, { status: 404 })

  const current = config.current_simulated_date
    ? new Date(config.current_simulated_date)
    : new Date('2025-03-20')
  current.setDate(current.getDate() + 1)

  const { error } = await db.from('simulation_config').update({
    current_simulated_date: current.toISOString().split('T')[0],
    updated_at: new Date().toISOString(),
  }).eq('id', config.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, newDate: current.toISOString().split('T')[0] })
}
