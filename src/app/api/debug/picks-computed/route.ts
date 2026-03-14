import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SPECIAL_SLUGS: Record<number, string> = {
  61: 'ff-r5-g1', 62: 'ff-r5-g2', 63: 'championship-r6-g1',
}

export async function GET(req: NextRequest) {
  const bracketId = req.nextUrl.searchParams.get('bracketId') || 'ed0e9077-eb03-43ba-afee-ce91a661898a'
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: bracket } = await supabase.from('brackets').select('picks').eq('id', bracketId).single()
  const { data: games } = await supabase.from('games').select('id, region, round, game_number').order('game_number')

  const GAMES_PER_REGION = [8, 4, 2, 1]
  const REGIONS = ['East', 'West', 'South', 'Midwest']
  const byRoundRegion: Record<string, Array<{id: string; region: string; round: number; game_number: number}>> = {}
  for (const g of games || []) {
    const key = `${g.round}-${g.region}`
    if (!byRoundRegion[key]) byRoundRegion[key] = []
    byRoundRegion[key].push(g)
  }
  for (const arr of Object.values(byRoundRegion)) arr.sort((a, b) => a.game_number - b.game_number)

  const gameIdMap = new Map<string, string>()
  for (const g of games || []) {
    const special = SPECIAL_SLUGS[g.game_number]
    if (special) { gameIdMap.set(g.id, special); continue }
    if (g.round <= 4) {
      const regionIdx = REGIONS.indexOf(g.region)
      if (regionIdx === -1) continue
      const arr = byRoundRegion[`${g.round}-${g.region}`] || []
      const withinIdx = arr.findIndex(x => x.id === g.id)
      const perRegion = GAMES_PER_REGION[g.round - 1]
      const bracketNum = regionIdx * perRegion + withinIdx + 1
      gameIdMap.set(g.id, `${g.region.toLowerCase()}-r${g.round}-g${bracketNum}`)
    }
  }

  const rawPicks = (bracket?.picks as Record<string, string>) || {}
  const picks: Record<string, string> = {}
  for (const [key, val] of Object.entries(rawPicks)) {
    const slug = gameIdMap.get(key)
    picks[slug ?? key] = val
  }

  return NextResponse.json({
    rawPicksCount: Object.keys(rawPicks).length,
    computedPicksCount: Object.keys(picks).length,
    r1: Object.entries(picks).filter(([k]) => k.includes('r1')).sort(),
    r2: Object.entries(picks).filter(([k]) => k.includes('r2')).sort(),
    r3: Object.entries(picks).filter(([k]) => k.includes('r3')).sort(),
    r4: Object.entries(picks).filter(([k]) => k.includes('r4')).sort(),
    r5: Object.entries(picks).filter(([k]) => k.includes('r5') || k.includes('championship')).sort(),
    gameIdMapSample: Object.fromEntries([...gameIdMap.entries()].slice(0, 10))
  })
}
