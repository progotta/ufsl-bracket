/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/adminAuth'
import { NextResponse } from 'next/server'

// Stateless anon client — no cookie session, reads public data without RLS session filtering
// (service role preferred but falls back to anon for public tables)
function createReadClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key)
}

// GET: fetch sim config + games with team info
export async function GET() {
  try {
    const authError = await requireAdmin()
    if (authError) return authError

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url) {
      return NextResponse.json({ error: 'Missing NEXT_PUBLIC_SUPABASE_URL' }, { status: 500 })
    }

    // Use service role for reads (bypasses RLS — admin only after requireAdmin check above)
    const db = createReadClient() as any

    const [configResult, gamesResult, teamsResult] = await Promise.all([
      db.from('simulation_config').select('*').limit(1).single(),
      db.from('games').select('*').order('round').order('game_number'),
      db.from('teams').select('id, name, abbreviation, seed, region'),
    ])

    // Join team data client-side to avoid Supabase FK join issues with null team IDs
    const teamMap = new Map((teamsResult.data || []).map((t: { id: string }) => [t.id, t]))
    const games = (gamesResult.data || []).map((g: { team1_id?: string; team2_id?: string; winner_id?: string }) => ({
      ...g,
      team1: g.team1_id ? teamMap.get(g.team1_id) ?? null : null,
      team2: g.team2_id ? teamMap.get(g.team2_id) ?? null : null,
      winner: g.winner_id ? teamMap.get(g.winner_id) ?? null : null,
    }))

    // Also try raw fetch as fallback
    let rawGames: unknown[] = games
    if (!games.length) {
      try {
        const r = await fetch(
          `${url}/rest/v1/games?select=*&order=round.asc,game_number.asc`,
          { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}` } }
        )
        const rawData = await r.json()
        if (Array.isArray(rawData)) {
          const tm = new Map((teamsResult.data || []).map((t: { id: string }) => [t.id, t]))
          rawGames = rawData.map((g: { team1_id?: string; team2_id?: string; winner_id?: string }) => ({
            ...g,
            team1: g.team1_id ? tm.get(g.team1_id) ?? null : null,
            team2: g.team2_id ? tm.get(g.team2_id) ?? null : null,
            winner: g.winner_id ? tm.get(g.winner_id) ?? null : null,
          }))
        }
      } catch { /* ignore */ }
    }

    return NextResponse.json({
      config: configResult.data,
      games: rawGames,
      _debug: {
        gamesCount: gamesResult.data?.length ?? null,
        gamesError: gamesResult.error?.message ?? null,
        teamsCount: teamsResult.data?.length ?? null,
        teamsError: teamsResult.error?.message ?? null,
        rawFallback: !games.length,
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Crash: ${msg}`, games: [] }, { status: 500 })
  }
}

// PATCH: update simulation config
export async function PATCH(request: Request) {
  const authError = await requireAdmin()
  if (authError) return authError

  const db = createReadClient() as any
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
