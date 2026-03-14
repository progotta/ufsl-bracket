import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const bracketId = req.nextUrl.searchParams.get('bracketId')
  if (!bracketId) return NextResponse.json({ error: 'no bracketId' })

  const supabase = createServerClient()
  const { data: bracket } = await supabase.from('brackets').select('picks').eq('id', bracketId).single()
  const { data: games } = await supabase.from('games').select('id, region, round, game_number, winner_id, team1_score, team2_score, status')

  const REGION_ORDER: Record<string, number> = { East: 0, West: 1, South: 2, Midwest: 3 }
  const GAMES_PER_REGION = [8, 4, 2, 1]
  const SPECIAL_SLUGS: Record<number, string> = {
    49: 'east-r3-g1',  50: 'west-r3-g3',  51: 'south-r3-g5',  52: 'midwest-r3-g7',
    53: 'east-r3-g2',  54: 'west-r3-g4',  55: 'south-r3-g6',  56: 'midwest-r3-g8',
    57: 'east-r4-g1',  58: 'west-r4-g2',  59: 'south-r4-g3',  60: 'midwest-r4-g4',
    61: 'ff-r5-g1', 62: 'ff-r5-g2', 63: 'championship-r6-g1',
  }

  const byRoundRegion: Record<string, {id: string; round: number; game_number: number; region: string}[]> = {}
  for (const g of games || []) {
    const key = `${g.round}-${g.region}`
    ;(byRoundRegion[key] = byRoundRegion[key] || []).push(g)
  }
  for (const arr of Object.values(byRoundRegion)) arr.sort((a, b) => a.game_number - b.game_number)

  const gameIdMap = new Map<string, string>()
  for (const g of games || []) {
    const special = SPECIAL_SLUGS[g.game_number]
    if (special) { gameIdMap.set(g.id, special); continue }
    if (g.round <= 4) {
      const regionIdx = REGION_ORDER[g.region] ?? 0
      const group = byRoundRegion[`${g.round}-${g.region}`] || []
      const withinIdx = group.findIndex(x => x.id === g.id)
      const bracketNum = regionIdx * GAMES_PER_REGION[g.round - 1] + withinIdx + 1
      gameIdMap.set(g.id, `${g.region.toLowerCase()}-r${g.round}-g${bracketNum}`)
    }
  }

  const rawPicks = (bracket?.picks as Record<string, string>) || {}
  const picks: Record<string, string> = {}
  for (const [key, val] of Object.entries(rawPicks)) {
    const slug = gameIdMap.get(key)
    picks[slug ?? key] = val
  }

  const gameResults: Record<string, {winnerId: string; team1Score?: number; team2Score?: number}> = {}
  for (const g of games || []) {
    if (g.winner_id) {
      const slug = gameIdMap.get(g.id) || g.id
      gameResults[slug] = { winnerId: g.winner_id, team1Score: g.team1_score ?? undefined, team2Score: g.team2_score ?? undefined }
    }
  }

  const r3Picks = Object.entries(picks).filter(([k]) => k.includes('r3'))
  const r3Results = Object.entries(gameResults).filter(([k]) => k.includes('r3'))
  const r2PicksSample = Object.entries(picks).filter(([k]) => k.includes('r2')).slice(0, 4)
  const game49 = games?.find(g => g.game_number === 49)

  return NextResponse.json({
    gameIdMapFor49: game49 ? gameIdMap.get(game49.id) : 'not found',
    game49id: game49?.id,
    r2PicksSample,
    r3Picks,
    r3GameResults: r3Results,
    totalPicks: Object.keys(picks).length,
    totalGameResults: Object.keys(gameResults).length,
    totalGames: games?.length,
  })
}
