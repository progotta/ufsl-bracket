// Bracket data structures and utilities

export interface BracketTeam {
  id: string
  name: string
  abbreviation: string
  seed: number
  region: string
  primaryColor?: string
  espnId?: number | null
}

export interface BracketGame {
  id: string
  round: number
  gameNumber: number
  region: string
  team1?: BracketTeam
  team2?: BracketTeam
  winner?: BracketTeam
  slot1: string // game slot key for team coming from top
  slot2: string // game slot key for team coming from bottom
  nextGameId?: string
  nextSlot?: 'team1' | 'team2'
}

export type Region = 'East' | 'West' | 'South' | 'Midwest'

// Standard NCAA bracket structure
// Round 1: 32 games (8 per region)
// Round 2: 16 games (4 per region)
// Sweet 16: 8 games (2 per region)
// Elite 8: 4 games (1 per region)
// Final Four: 2 games
// Championship: 1 game

export const REGIONS: Region[] = ['East', 'West', 'South', 'Midwest']

export const ROUND_NAMES: Record<number, string> = {
  1: 'Round of 64',
  2: 'Round of 32',
  3: 'Sweet 16',
  4: 'Elite 8',
  5: 'Final Four',
  6: 'Championship',
}

export const ROUND_POINTS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 8,
  5: 16,
  6: 32,
}

export const MAX_POINTS = 192 // 32*1 + 16*2 + 8*4 + 4*8 + 2*16 + 1*32

// Region bracket matchups (seed pairings)
// Standard: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
export const REGION_MATCHUPS: [number, number][] = [
  [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15]
]

// Game IDs are deterministic: {region}-r{round}-g{game}
export function gameId(region: string, round: number, game: number): string {
  return `${region.toLowerCase()}-r${round}-g${game}`
}

// Build a full empty bracket structure from 64 teams
export function buildBracketStructure(teams: BracketTeam[]): BracketGame[] {
  const games: BracketGame[] = []

  REGIONS.forEach((region, regionIdx) => {
    const regionTeams = teams
      .filter(t => t.region === region)
      .sort((a, b) => a.seed - b.seed)

    if (regionTeams.length < 16) {
      // Pad with placeholder teams if not enough
      for (let i = regionTeams.length + 1; i <= 16; i++) {
        regionTeams.push({
          id: `placeholder-${region}-${i}`,
          name: `TBD`,
          abbreviation: 'TBD',
          seed: i,
          region,
        })
      }
    }

    const getTeam = (seed: number) => regionTeams.find(t => t.seed === seed)

    // Round 1: 8 games per region
    REGION_MATCHUPS.forEach(([seed1, seed2], gameIdx) => {
      const id = gameId(region, 1, regionIdx * 8 + gameIdx + 1)
      const nextGameGame = Math.floor(gameIdx / 2) + 1
      const nextId = gameId(region, 2, regionIdx * 4 + nextGameGame)
      games.push({
        id,
        round: 1,
        gameNumber: regionIdx * 8 + gameIdx + 1,
        region,
        team1: getTeam(seed1),
        team2: getTeam(seed2),
        slot1: id,
        slot2: id,
        nextGameId: nextId,
        nextSlot: gameIdx % 2 === 0 ? 'team1' : 'team2',
      })
    })

    // Round 2: 4 games per region
    for (let i = 0; i < 4; i++) {
      const id = gameId(region, 2, regionIdx * 4 + i + 1)
      const nextGameGame = Math.floor(i / 2) + 1
      const nextId = gameId(region, 3, regionIdx * 2 + nextGameGame)
      games.push({
        id,
        round: 2,
        gameNumber: regionIdx * 4 + i + 1,
        region,
        slot1: gameId(region, 1, regionIdx * 8 + i * 2 + 1),
        slot2: gameId(region, 1, regionIdx * 8 + i * 2 + 2),
        nextGameId: nextId,
        nextSlot: i % 2 === 0 ? 'team1' : 'team2',
      })
    }

    // Sweet 16: 2 games per region
    for (let i = 0; i < 2; i++) {
      const id = gameId(region, 3, regionIdx * 2 + i + 1)
      const nextId = gameId(region, 4, regionIdx + 1)
      games.push({
        id,
        round: 3,
        gameNumber: regionIdx * 2 + i + 1,
        region,
        slot1: gameId(region, 2, regionIdx * 4 + i * 2 + 1),
        slot2: gameId(region, 2, regionIdx * 4 + i * 2 + 2),
        nextGameId: nextId,
        nextSlot: i % 2 === 0 ? 'team1' : 'team2',
      })
    }

    // Elite 8: 1 game per region
    const elite8Id = gameId(region, 4, regionIdx + 1)
    const ff_gameNum = regionIdx < 2 ? 1 : 2
    const ffId = `ff-r5-g${ff_gameNum}`
    games.push({
      id: elite8Id,
      round: 4,
      gameNumber: regionIdx + 1,
      region,
      slot1: gameId(region, 3, regionIdx * 2 + 1),
      slot2: gameId(region, 3, regionIdx * 2 + 2),
      nextGameId: ffId,
      nextSlot: regionIdx % 2 === 0 ? 'team1' : 'team2',
    })
  })

  // Final Four: 2 games
  // East vs West, South vs Midwest (traditional)
  games.push({
    id: 'ff-r5-g1',
    round: 5,
    gameNumber: 1,
    region: 'Final Four',
    slot1: gameId('East', 4, 1),
    slot2: gameId('West', 4, 2),
    nextGameId: 'championship-r6-g1',
    nextSlot: 'team1',
  })
  games.push({
    id: 'ff-r5-g2',
    round: 5,
    gameNumber: 2,
    region: 'Final Four',
    slot1: gameId('South', 4, 3),
    slot2: gameId('Midwest', 4, 4),
    nextGameId: 'championship-r6-g1',
    nextSlot: 'team2',
  })

  // Championship
  games.push({
    id: 'championship-r6-g1',
    round: 6,
    gameNumber: 1,
    region: 'Championship',
    slot1: 'ff-r5-g1',
    slot2: 'ff-r5-g2',
  })

  return games
}

// Given picks (gameId -> teamId), resolve which teams appear in each game slot
export function resolveBracket(
  games: BracketGame[],
  picks: Record<string, string>,
  teams: BracketTeam[]
): BracketGame[] {
  const teamMap = new Map(teams.map(t => [t.id, t]))
  const gameMap = new Map(games.map(g => [g.id, { ...g }]))

  // Process rounds 1-6 in order
  for (let round = 2; round <= 6; round++) {
    const roundGames = games.filter(g => g.round === round)
    for (const game of roundGames) {
      const resolvedGame = gameMap.get(game.id)!
      
      // Get winners from previous round games
      const slot1Game = gameMap.get(game.slot1)
      const slot2Game = gameMap.get(game.slot2)
      
      if (slot1Game) {
        const winnerId = picks[slot1Game.id]
        if (winnerId) {
          resolvedGame.team1 = teamMap.get(winnerId) || slot1Game.team1
        } else if (slot1Game.round === 1) {
          resolvedGame.team1 = undefined
        }
      }
      
      if (slot2Game) {
        const winnerId = picks[slot2Game.id]
        if (winnerId) {
          resolvedGame.team2 = teamMap.get(winnerId) || slot2Game.team2
        } else if (slot2Game.round === 1) {
          resolvedGame.team2 = undefined
        }
      }

      if (game.id === 'east-r3-g1' && typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.log('[r3g1]', {
          slot1: game.slot1, slot1id: slot1Game?.id,
          picks_slot1: picks[slot1Game?.id ?? '']?.slice(0,8),
          team1: resolvedGame.team1?.abbreviation,
          slot2: game.slot2, slot2id: slot2Game?.id,
          picks_slot2: picks[slot2Game?.id ?? '']?.slice(0,8),
          team2: resolvedGame.team2?.abbreviation,
        })
      }
    }
  }

  return Array.from(gameMap.values())
}

// Calculate score given picks and actual game results
export function calculateScore(
  picks: Record<string, string>,
  results: Record<string, string> // gameId -> winning teamId
): { score: number; correct: number; total: number } {
  let score = 0
  let correct = 0
  let total = 0

  for (const [gameId, winnerId] of Object.entries(results)) {
    if (winnerId) {
      total++
      const pick = picks[gameId]
      if (pick === winnerId) {
        const round = parseInt(gameId.split('-r')[1]?.split('-')[0] || '1')
        score += ROUND_POINTS[round] || 1
        correct++
      }
    }
  }

  return { score, correct, total }
}

// Mock teams for development (will be replaced with real Selection Sunday data)
export const MOCK_TEAMS: BracketTeam[] = [
  // East
  { id: 'e1', name: 'Duke', abbreviation: 'DUKE', seed: 1, region: 'East', primaryColor: '#012169', espnId: 150 },
  { id: 'e2', name: 'Kentucky', abbreviation: 'UK', seed: 2, region: 'East', primaryColor: '#0033A0', espnId: 96 },
  { id: 'e3', name: 'Gonzaga', abbreviation: 'GONZ', seed: 3, region: 'East', primaryColor: '#002161', espnId: 2250 },
  { id: 'e4', name: 'Tennessee', abbreviation: 'TENN', seed: 4, region: 'East', primaryColor: '#FF8200', espnId: 2633 },
  { id: 'e5', name: 'Michigan State', abbreviation: 'MSU', seed: 5, region: 'East', primaryColor: '#18453B', espnId: 127 },
  { id: 'e6', name: 'Creighton', abbreviation: 'CRE', seed: 6, region: 'East', primaryColor: '#005CA9', espnId: 156 },
  { id: 'e7', name: 'Xavier', abbreviation: 'XAV', seed: 7, region: 'East', primaryColor: '#0C2340', espnId: 2752 },
  { id: 'e8', name: 'Florida Atlantic', abbreviation: 'FAU', seed: 8, region: 'East', primaryColor: '#003366', espnId: 2229 },
  { id: 'e9', name: 'Memphis', abbreviation: 'MEM', seed: 9, region: 'East', primaryColor: '#003087', espnId: 235 },
  { id: 'e10', name: 'Utah State', abbreviation: 'USU', seed: 10, region: 'East', primaryColor: '#003263', espnId: 328 },
  { id: 'e11', name: 'Providence', abbreviation: 'PROV', seed: 11, region: 'East', primaryColor: '#002147', espnId: 2507 },
  { id: 'e12', name: 'Oral Roberts', abbreviation: 'ORU', seed: 12, region: 'East', primaryColor: '#5C2D91', espnId: 198 },
  { id: 'e13', name: 'Louisiana', abbreviation: 'ULL', seed: 13, region: 'East', primaryColor: '#CE181E', espnId: 309 },
  { id: 'e14', name: 'Montana State', abbreviation: 'MTST', seed: 14, region: 'East', primaryColor: '#003875', espnId: 149 },
  { id: 'e15', name: 'Vermont', abbreviation: 'UVM', seed: 15, region: 'East', primaryColor: '#154734', espnId: 261 },
  { id: 'e16', name: 'Howard', abbreviation: 'HOW', seed: 16, region: 'East', primaryColor: '#003A63', espnId: 47 },
  // West
  { id: 'w1', name: 'Kansas', abbreviation: 'KU', seed: 1, region: 'West', primaryColor: '#0051A5', espnId: 2305 },
  { id: 'w2', name: 'Arizona', abbreviation: 'ARIZ', seed: 2, region: 'West', primaryColor: '#CC0033', espnId: 12 },
  { id: 'w3', name: 'Baylor', abbreviation: 'BAY', seed: 3, region: 'West', primaryColor: '#1B3A5C', espnId: 239 },
  { id: 'w4', name: 'Virginia', abbreviation: 'UVA', seed: 4, region: 'West', primaryColor: '#232D4B', espnId: 258 },
  { id: 'w5', name: 'San Diego St', abbreviation: 'SDSU', seed: 5, region: 'West', primaryColor: '#CC0033', espnId: 21 },
  { id: 'w6', name: 'TCU', abbreviation: 'TCU', seed: 6, region: 'West', primaryColor: '#4D1979', espnId: 2628 },
  { id: 'w7', name: 'Missouri', abbreviation: 'MIZ', seed: 7, region: 'West', primaryColor: '#F1B82D', espnId: 142 },
  { id: 'w8', name: 'Maryland', abbreviation: 'MD', seed: 8, region: 'West', primaryColor: '#E03A3E', espnId: 120 },
  { id: 'w9', name: 'West Virginia', abbreviation: 'WVU', seed: 9, region: 'West', primaryColor: '#002855', espnId: 277 },
  { id: 'w10', name: 'Utah', abbreviation: 'UTAH', seed: 10, region: 'West', primaryColor: '#CC0000', espnId: 254 },
  { id: 'w11', name: 'NC State', abbreviation: 'NCST', seed: 11, region: 'West', primaryColor: '#CC0000', espnId: 152 },
  { id: 'w12', name: 'Charleston', abbreviation: 'COFC', seed: 12, region: 'West', primaryColor: '#532281', espnId: 232 },
  { id: 'w13', name: 'Iona', abbreviation: 'IONA', seed: 13, region: 'West', primaryColor: '#7B0000', espnId: 314 },
  { id: 'w14', name: 'Grand Canyon', abbreviation: 'GCU', seed: 14, region: 'West', primaryColor: '#512D6D', espnId: 2253 },
  { id: 'w15', name: 'UNC Asheville', abbreviation: 'UNCA', seed: 15, region: 'West', primaryColor: '#002868', espnId: 2427 },
  { id: 'w16', name: 'Texas Southern', abbreviation: 'TXSO', seed: 16, region: 'West', primaryColor: '#4B1869', espnId: 2640 },
  // South
  { id: 's1', name: 'Alabama', abbreviation: 'ALA', seed: 1, region: 'South', primaryColor: '#9E1B32', espnId: 333 },
  { id: 's2', name: 'Marquette', abbreviation: 'MU', seed: 2, region: 'South', primaryColor: '#003087', espnId: 269 },
  { id: 's3', name: 'Purdue', abbreviation: 'PUR', seed: 3, region: 'South', primaryColor: '#CEB888', espnId: 2509 },
  { id: 's4', name: 'Indiana', abbreviation: 'IND', seed: 4, region: 'South', primaryColor: '#990000', espnId: 84 },
  { id: 's5', name: 'Miami', abbreviation: 'MIA', seed: 5, region: 'South', primaryColor: '#005030', espnId: 2390 },
  { id: 's6', name: 'Iowa State', abbreviation: 'ISU', seed: 6, region: 'South', primaryColor: '#C8102E', espnId: 66 },
  { id: 's7', name: 'Texas A&M', abbreviation: 'TAMU', seed: 7, region: 'South', primaryColor: '#500000', espnId: 245 },
  { id: 's8', name: 'Iowa', abbreviation: 'IOWA', seed: 8, region: 'South', primaryColor: '#FFCD00', espnId: 2294 },
  { id: 's9', name: 'Auburn', abbreviation: 'AUB', seed: 9, region: 'South', primaryColor: '#0C2340', espnId: 2 },
  { id: 's10', name: 'Penn State', abbreviation: 'PSU', seed: 10, region: 'South', primaryColor: '#041E42', espnId: 213 },
  { id: 's11', name: 'Pittsburgh', abbreviation: 'PITT', seed: 11, region: 'South', primaryColor: '#003594', espnId: 221 },
  { id: 's12', name: 'Drake', abbreviation: 'DRKE', seed: 12, region: 'South', primaryColor: '#00447C', espnId: 2181 },
  { id: 's13', name: 'Kent State', abbreviation: 'KENT', seed: 13, region: 'South', primaryColor: '#002664', espnId: 2309 },
  { id: 's14', name: 'Kennesaw St', abbreviation: 'KENN', seed: 14, region: 'South', primaryColor: '#FDBB30', espnId: 338584 },
  { id: 's15', name: 'Colgate', abbreviation: 'COLG', seed: 15, region: 'South', primaryColor: '#B3222A' },
  { id: 's16', name: 'SE Missouri St', abbreviation: 'SEMO', seed: 16, region: 'South', primaryColor: '#C8102E', espnId: 2546 },
  // Midwest
  { id: 'm1', name: 'Houston', abbreviation: 'HOU', seed: 1, region: 'Midwest', primaryColor: '#C8102E', espnId: 248 },
  { id: 'm2', name: 'Texas', abbreviation: 'TEX', seed: 2, region: 'Midwest', primaryColor: '#BF5700', espnId: 251 },
  { id: 'm3', name: 'Indiana', abbreviation: 'IU', seed: 3, region: 'Midwest', primaryColor: '#990000', espnId: 84 },
  { id: 'm4', name: 'Arkansas', abbreviation: 'ARK', seed: 4, region: 'Midwest', primaryColor: '#9D2235', espnId: 8 },
  { id: 'm5', name: 'Illinois', abbreviation: 'ILL', seed: 5, region: 'Midwest', primaryColor: '#E84A27', espnId: 356 },
  { id: 'm6', name: 'Arizona State', abbreviation: 'ASU', seed: 6, region: 'Midwest', primaryColor: '#8C1D40', espnId: 9 },
  { id: 'm7', name: 'VCU', abbreviation: 'VCU', seed: 7, region: 'Midwest', primaryColor: '#FFB300', espnId: 2670 },
  { id: 'm8', name: 'Iowa', abbreviation: 'IOWA2', seed: 8, region: 'Midwest', primaryColor: '#FFCD00', espnId: 2294 },
  { id: 'm9', name: 'Auburn', abbreviation: 'AUB2', seed: 9, region: 'Midwest', primaryColor: '#0C2340', espnId: 2 },
  { id: 'm10', name: 'Penn State', abbreviation: 'PSU2', seed: 10, region: 'Midwest', primaryColor: '#041E42', espnId: 213 },
  { id: 'm11', name: 'Pittsburgh', abbreviation: 'PITT2', seed: 11, region: 'Midwest', primaryColor: '#003594', espnId: 221 },
  { id: 'm12', name: 'Furman', abbreviation: 'FUR', seed: 12, region: 'Midwest', primaryColor: '#582C83', espnId: 231 },
  { id: 'm13', name: 'UC Santa Barbara', abbreviation: 'UCSB', seed: 13, region: 'Midwest', primaryColor: '#003660', espnId: 2540 },
  { id: 'm14', name: 'Princeton', abbreviation: 'PRIN', seed: 14, region: 'Midwest', primaryColor: '#FF8F00', espnId: 163 },
  { id: 'm15', name: 'Vermont', abbreviation: 'UVM2', seed: 15, region: 'Midwest', primaryColor: '#154734', espnId: 261 },
  { id: 'm16', name: 'N. Kentucky', abbreviation: 'NKU', seed: 16, region: 'Midwest', primaryColor: '#B0B7BC', espnId: 94 },
]
