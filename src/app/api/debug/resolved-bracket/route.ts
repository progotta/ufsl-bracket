import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { buildBracketStructure, resolveBracket } from '@/lib/bracket'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: bracket }, { data: teams }, { data: games }] = await Promise.all([
    supabase.from('brackets').select('picks').eq('id', 'ed0e9077-eb03-43ba-afee-ce91a661898a').single(),
    supabase.from('teams').select('*').eq('is_active', true),
    supabase.from('games').select('id, region, round, game_number').order('game_number'),
  ])

  const SPECIAL_SLUGS: Record<number, string> = { 61: 'ff-r5-g1', 62: 'ff-r5-g2', 63: 'championship-r6-g1' }
  const REGIONS = ['East', 'West', 'South', 'Midwest']
  const GAMES_PER_REGION = [8, 4, 2, 1]
  const byRoundRegion: Record<string, Array<{id:string;round:number;region:string;game_number:number}>> = {}
  for (const g of games || []) {
    const key = `${g.round}-${g.region}`
    if (!byRoundRegion[key]) byRoundRegion[key] = []
    byRoundRegion[key].push(g)
  }
  for (const arr of Object.values(byRoundRegion)) arr.sort((a, b) => a.game_number - b.game_number)
  const gameIdMap = new Map<string, string>()
  for (const g of games || []) {
    const special = SPECIAL_SLUGS[g.game_number]; if (special) { gameIdMap.set(g.id, special); continue }
    if (g.round <= 4) {
      const regionIdx = REGIONS.indexOf(g.region); if (regionIdx === -1) continue
      const arr = byRoundRegion[`${g.round}-${g.region}`] || []
      const withinIdx = arr.findIndex(x => x.id === g.id)
      gameIdMap.set(g.id, `${g.region.toLowerCase()}-r${g.round}-g${regionIdx * GAMES_PER_REGION[g.round-1] + withinIdx + 1}`)
    }
  }

  const rawPicks = (bracket?.picks as Record<string, string>) || {}
  const picks: Record<string, string> = {}
  for (const [key, val] of Object.entries(rawPicks)) { const slug = gameIdMap.get(key); picks[slug ?? key] = val }

  const pickerTeams = (teams || []).map(t => ({
    id: t.id, name: t.name, abbreviation: t.abbreviation,
    seed: t.seed || 1, region: t.region || 'East',
    primaryColor: t.primary_color || undefined, espnId: t.espn_id || undefined
  }))

  const baseGames = buildBracketStructure(pickerTeams)
  const resolved = resolveBracket(baseGames, picks, pickerTeams)

  const r3 = resolved.filter(g => g.round === 3).map(g => ({
    id: g.id, gameNumber: g.gameNumber,
    team1: g.team1 ? `${g.team1.abbreviation}(s${g.team1.seed})` : 'TBD',
    team2: g.team2 ? `${g.team2.abbreviation}(s${g.team2.seed})` : 'TBD',
  })).sort((a, b) => a.gameNumber - b.gameNumber)

  return NextResponse.json({ teamsCount: pickerTeams.length, picksCount: Object.keys(picks).length, r3 })
}
