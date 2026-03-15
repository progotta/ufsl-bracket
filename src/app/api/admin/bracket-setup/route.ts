import { requireAdmin } from '@/lib/adminAuth'
import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const MATCHUPS_R1 = [[1,16],[8,9],[5,12],[4,13],[6,11],[3,14],[7,10],[2,15]]
const REGIONS: Array<'East' | 'West' | 'South' | 'Midwest'> = ['East', 'West', 'South', 'Midwest']

export async function POST(req: NextRequest) {
  try {
  const authError = await requireAdmin()
  if (authError) return authError

  const body = await req.json().catch(() => ({} as any))
  const { action, data } = body
  const supabase = createServiceClient()

  if (action === 'import_teams') {
    const { teams, season = 2026 } = data as { teams: Array<{ name: string; abbreviation: string; seed: number; region: string; espn_id?: number }>; season?: number }

    if (!teams || !Array.isArray(teams) || teams.length === 0) {
      return NextResponse.json({ error: 'No teams provided' }, { status: 400 })
    }

    const rows = teams.map(t => ({
      name: t.name,
      abbreviation: t.abbreviation,
      seed: t.seed,
      region: t.region,
      espn_id: t.espn_id || null,
      season,
      is_active: true,
    }))

    const { data: inserted, error } = await supabase
      .from('teams')
      .insert(rows)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: inserted?.length || 0 })
  }

  if (action === 'generate_games') {
    const { season = 2026 } = data || {}

    // Fetch teams for this season
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .eq('season', season)

    if (teamsError) {
      return NextResponse.json({ error: teamsError.message }, { status: 500 })
    }

    if (!teams || teams.length !== 64) {
      return NextResponse.json({
        error: `Need exactly 64 teams for season ${season}, found ${teams?.length || 0}`,
      }, { status: 400 })
    }

    // Verify 16 per region with seeds 1-16
    for (const region of REGIONS) {
      const regionTeams = teams.filter(t => t.region === region)
      if (regionTeams.length !== 16) {
        return NextResponse.json({
          error: `Region ${region} has ${regionTeams.length} teams, need 16`,
        }, { status: 400 })
      }
      const seeds = regionTeams.map(t => t.seed).sort((a, b) => (a || 0) - (b || 0))
      for (let s = 1; s <= 16; s++) {
        if (!seeds.includes(s)) {
          return NextResponse.json({
            error: `Region ${region} missing seed ${s}`,
          }, { status: 400 })
        }
      }
    }

    // Delete existing games for this season
    await supabase.from('games').delete().eq('season', season)

    // Generate all 63 games
    const allGames: Array<{
      round: number
      game_number: number
      region: string | null
      team1_id: string | null
      team2_id: string | null
      status: string
      season: number
    }> = []

    let gameNumber = 1

    // R1: 32 games (8 per region)
    for (const region of REGIONS) {
      const regionTeams = teams.filter(t => t.region === region)
      for (const [seed1, seed2] of MATCHUPS_R1) {
        const t1 = regionTeams.find(t => t.seed === seed1)!
        const t2 = regionTeams.find(t => t.seed === seed2)!
        allGames.push({
          round: 1,
          game_number: gameNumber++,
          region,
          team1_id: t1.id,
          team2_id: t2.id,
          status: 'scheduled',
          season,
        })
      }
    }

    // R2-R4: Placeholder games per region
    // R2: 16 games (4 per region)
    for (const region of REGIONS) {
      for (let i = 0; i < 4; i++) {
        allGames.push({
          round: 2, game_number: gameNumber++, region,
          team1_id: null, team2_id: null, status: 'scheduled', season,
        })
      }
    }

    // R3 (Sweet 16): 8 games (2 per region)
    for (const region of REGIONS) {
      for (let i = 0; i < 2; i++) {
        allGames.push({
          round: 3, game_number: gameNumber++, region,
          team1_id: null, team2_id: null, status: 'scheduled', season,
        })
      }
    }

    // R4 (Elite 8): 4 games (1 per region)
    for (const region of REGIONS) {
      allGames.push({
        round: 4, game_number: gameNumber++, region,
        team1_id: null, team2_id: null, status: 'scheduled', season,
      })
    }

    // R5 (Final Four): 2 games
    for (let i = 0; i < 2; i++) {
      allGames.push({
        round: 5, game_number: gameNumber++, region: 'Final Four',
        team1_id: null, team2_id: null, status: 'scheduled', season,
      })
    }

    // R6 (Championship): 1 game
    allGames.push({
      round: 6, game_number: gameNumber++, region: 'Championship',
      team1_id: null, team2_id: null, status: 'scheduled', season,
    })

    // Insert games
    const { data: insertedGames, error: gamesError } = await supabase
      .from('games')
      .insert(allGames)
      .select('id, round, game_number, region')

    if (gamesError) {
      return NextResponse.json({ error: gamesError.message }, { status: 500 })
    }

    // Wire up next_game_id relationships
    if (insertedGames) {
      const gamesByRoundAndRegion = new Map<string, typeof insertedGames>()
      for (const g of insertedGames) {
        const key = `${g.round}:${g.region}`
        if (!gamesByRoundAndRegion.has(key)) gamesByRoundAndRegion.set(key, [])
        gamesByRoundAndRegion.get(key)!.push(g)
      }

      // Sort each group by game_number
      Array.from(gamesByRoundAndRegion.values()).forEach(group => {
        group.sort((a, b) => a.game_number - b.game_number)
      })

      // R1 games feed into R2 games (pairs)
      for (const region of REGIONS) {
        const r1Games = gamesByRoundAndRegion.get(`1:${region}`) || []
        const r2Games = gamesByRoundAndRegion.get(`2:${region}`) || []
        for (let i = 0; i < r1Games.length; i++) {
          const nextGame = r2Games[Math.floor(i / 2)]
          if (nextGame) {
            await supabase.from('games').update({ next_game_id: nextGame.id }).eq('id', r1Games[i].id)
          }
        }
      }

      // R2 → R3
      for (const region of REGIONS) {
        const r2Games = gamesByRoundAndRegion.get(`2:${region}`) || []
        const r3Games = gamesByRoundAndRegion.get(`3:${region}`) || []
        for (let i = 0; i < r2Games.length; i++) {
          const nextGame = r3Games[Math.floor(i / 2)]
          if (nextGame) {
            await supabase.from('games').update({ next_game_id: nextGame.id }).eq('id', r2Games[i].id)
          }
        }
      }

      // R3 → R4
      for (const region of REGIONS) {
        const r3Games = gamesByRoundAndRegion.get(`3:${region}`) || []
        const r4Games = gamesByRoundAndRegion.get(`4:${region}`) || []
        for (let i = 0; i < r3Games.length; i++) {
          if (r4Games[0]) {
            await supabase.from('games').update({ next_game_id: r4Games[0].id }).eq('id', r3Games[i].id)
          }
        }
      }

      // R4 → R5 (Final Four)
      const r4AllGames = insertedGames.filter(g => g.round === 4).sort((a, b) => a.game_number - b.game_number)
      const r5Games = insertedGames.filter(g => g.round === 5).sort((a, b) => a.game_number - b.game_number)
      for (let i = 0; i < r4AllGames.length; i++) {
        const nextGame = r5Games[Math.floor(i / 2)]
        if (nextGame) {
          await supabase.from('games').update({ next_game_id: nextGame.id }).eq('id', r4AllGames[i].id)
        }
      }

      // R5 → R6 (Championship)
      const r6Game = insertedGames.find(g => g.round === 6)
      for (const g of r5Games) {
        if (r6Game) {
          await supabase.from('games').update({ next_game_id: r6Game.id }).eq('id', g.id)
        }
      }
    }

    return NextResponse.json({ success: true, gamesCreated: insertedGames?.length || 0 })
  }

  if (action === 'reset_season') {
    const { season = 2026 } = data || {}
    await supabase.from('games').delete().eq('season', season)
    await supabase.from('teams').delete().eq('season', season)
    return NextResponse.json({ success: true })
  }

  if (action === 'delete_team') {
    const { teamId } = data || {}
    if (!teamId) return NextResponse.json({ error: 'teamId required' }, { status: 400 })
    const { error } = await supabase.from('teams').delete().eq('id', teamId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err) {
    console.error('[admin/bracket-setup]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  const supabase = createServiceClient()
  const season = parseInt(req.nextUrl.searchParams.get('season') || '2026')

  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .eq('season', season)
    .order('region')
    .order('seed')

  const { data: games } = await supabase
    .from('games')
    .select('*')
    .eq('season', season)
    .order('round')
    .order('game_number')

  return NextResponse.json({ teams: teams || [], games: games || [], season })
}
