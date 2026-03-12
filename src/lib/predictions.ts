/**
 * Predictions & Odds Library
 *
 * Mock data structures + API integration points for:
 *  - Win probabilities (FiveThirtyEight / KenPom style)
 *  - Betting lines (The Odds API)
 *  - Historical seed matchup stats
 *  - Crowd picks (internal brackets table)
 */

// ============================================================
// Types
// ============================================================

export interface TeamPrediction {
  teamId: string
  winProbability: number      // 0–100
  source: string              // e.g. "FiveThirtyEight"
  rating?: number             // KenPom rating or similar
  projectedScore?: number
}

export interface GameOdds {
  gameId?: string             // bracket game id if known
  matchupKey: string          // e.g. "1v16"
  favoriteTeamId: string
  spread: number              // positive = underdog points, e.g. -5.5 means fav -5.5
  spreadLabel: string         // e.g. "Duke -5.5"
  moneylineFav: number        // e.g. -220
  moneylineDog: number        // e.g. +180
  overUnder?: number          // e.g. 143.5
  booksSource: string         // e.g. "The Odds API"
  updatedAt: string
}

export interface SeedMatchupStat {
  seed1: number
  seed2: number
  higherSeedWinPct: number    // 0–100, % that the lower-numbered seed wins
  sampleSize: number          // # of historical games
  upsets: number              // # of times higher seed lost
  label: string               // human-readable
  note?: string               // fun fact
}

export interface CrowdPickResult {
  gameId: string
  team1Id: string
  team2Id: string
  team1Pct: number            // 0–100
  team2Pct: number            // 0–100
  totalPicks: number
}

export interface MatchupInsights {
  team1Prediction?: TeamPrediction
  team2Prediction?: TeamPrediction
  odds?: GameOdds
  seedStat?: SeedMatchupStat
  crowdPicks?: CrowdPickResult
}

// ============================================================
// Historical Seed Matchup Stats (based on 1985–2024 data)
// ============================================================

export const SEED_MATCHUP_STATS: Record<string, SeedMatchupStat> = {
  '1v16': {
    seed1: 1, seed2: 16, higherSeedWinPct: 99.4, sampleSize: 160, upsets: 1,
    label: '1-seeds win 99% of first round games',
    note: 'Only UMBC (2018) has ever upset a 1-seed',
  },
  '2v15': {
    seed1: 2, seed2: 15, higherSeedWinPct: 93.8, sampleSize: 160, upsets: 10,
    label: '2-seeds win 94% of first round games',
    note: '15-seeds have won 10 first round games all-time',
  },
  '3v14': {
    seed1: 3, seed2: 14, higherSeedWinPct: 85.0, sampleSize: 160, upsets: 24,
    label: '3-seeds win 85% of first round games',
  },
  '4v13': {
    seed1: 4, seed2: 13, higherSeedWinPct: 80.6, sampleSize: 160, upsets: 31,
    label: '4-seeds win 81% of first round games',
    note: '13-seeds are dangerous — ~1 per tournament',
  },
  '5v12': {
    seed1: 5, seed2: 12, higherSeedWinPct: 64.4, sampleSize: 160, upsets: 57,
    label: '12-seeds upset 5-seeds 36% of the time',
    note: 'The classic bracketology tip: pick at least one 12-over-5',
  },
  '6v11': {
    seed1: 6, seed2: 11, higherSeedWinPct: 63.1, sampleSize: 160, upsets: 59,
    label: '11-seeds pull upsets 37% of the time',
    note: '11-seeds make the Sweet 16 about once per year',
  },
  '7v10': {
    seed1: 7, seed2: 10, higherSeedWinPct: 60.0, sampleSize: 160, upsets: 64,
    label: '7 vs 10 is nearly a coin flip (60/40)',
  },
  '8v9': {
    seed1: 8, seed2: 9, higherSeedWinPct: 50.6, sampleSize: 160, upsets: 79,
    label: '8 vs 9 is basically a coin flip',
    note: 'True toss-up — pick your gut',
  },
}

export function getSeedMatchupStat(seed1: number, seed2: number): SeedMatchupStat | undefined {
  const low = Math.min(seed1, seed2)
  const high = Math.max(seed1, seed2)
  return SEED_MATCHUP_STATS[`${low}v${high}`]
}

// ============================================================
// Mock Team Predictions (win probability for Round 1)
// ============================================================

// These mirror the MOCK_TEAMS in bracket.ts
// In production: fetch from FiveThirtyEight / KenPom / The Odds API
const MOCK_WIN_PROBS: Record<string, { prob: number; rating?: number }> = {
  // East
  e1: { prob: 94, rating: 98.2 },   // Duke
  e2: { prob: 87, rating: 93.1 },   // Kentucky
  e3: { prob: 82, rating: 89.5 },   // Gonzaga
  e4: { prob: 79, rating: 87.3 },   // Tennessee
  e5: { prob: 63, rating: 74.2 },   // Michigan State
  e6: { prob: 61, rating: 72.1 },   // Creighton
  e7: { prob: 58, rating: 68.4 },   // Xavier
  e8: { prob: 51, rating: 62.8 },   // Florida Atlantic
  e9: { prob: 49, rating: 61.2 },   // Memphis
  e10: { prob: 42, rating: 55.3 },  // Utah State
  e11: { prob: 39, rating: 52.1 },  // Providence
  e12: { prob: 37, rating: 49.8 },  // Oral Roberts
  e13: { prob: 21, rating: 41.2 },  // Louisiana
  e14: { prob: 18, rating: 38.7 },  // Montana State
  e15: { prob: 13, rating: 32.4 },  // Vermont
  e16: { prob: 6, rating: 21.1 },   // Howard
  // West
  w1: { prob: 93, rating: 97.8 },   // Kansas
  w2: { prob: 86, rating: 92.4 },   // Arizona
  w3: { prob: 81, rating: 88.9 },   // Baylor
  w4: { prob: 78, rating: 86.2 },   // Virginia
  w5: { prob: 65, rating: 75.8 },   // San Diego St
  w6: { prob: 62, rating: 73.4 },   // TCU
  w7: { prob: 59, rating: 69.7 },   // Missouri
  w8: { prob: 52, rating: 63.9 },   // Maryland
  w9: { prob: 48, rating: 60.1 },   // West Virginia
  w10: { prob: 41, rating: 54.6 },  // Utah
  w11: { prob: 38, rating: 51.3 },  // NC State
  w12: { prob: 35, rating: 48.2 },  // Charleston
  w13: { prob: 22, rating: 42.8 },  // Iona
  w14: { prob: 19, rating: 39.4 },  // Grand Canyon
  w15: { prob: 14, rating: 33.1 },  // UNC Asheville
  w16: { prob: 7, rating: 22.6 },   // Texas Southern
  // South
  s1: { prob: 95, rating: 98.9 },   // Alabama
  s2: { prob: 88, rating: 94.2 },   // Marquette
  s3: { prob: 83, rating: 90.1 },   // Purdue
  s4: { prob: 80, rating: 87.8 },   // Indiana
  s5: { prob: 64, rating: 75.1 },   // Miami
  s6: { prob: 60, rating: 71.8 },   // Iowa State
  s7: { prob: 57, rating: 67.9 },   // Texas A&M
  s8: { prob: 50, rating: 62.3 },   // Iowa
  s9: { prob: 50, rating: 61.7 },   // Auburn
  s10: { prob: 43, rating: 56.1 },  // Penn State
  s11: { prob: 40, rating: 53.2 },  // Pittsburgh
  s12: { prob: 36, rating: 48.9 },  // Drake
  s13: { prob: 20, rating: 40.7 },  // Kent State
  s14: { prob: 17, rating: 37.2 },  // Kennesaw St
  s15: { prob: 12, rating: 31.8 },  // Colgate
  s16: { prob: 5, rating: 20.3 },   // SE Missouri St
  // Midwest
  m1: { prob: 96, rating: 99.1 },   // Houston
  m2: { prob: 89, rating: 95.4 },   // Texas
  m3: { prob: 84, rating: 91.3 },   // Indiana (Midwest)
  m4: { prob: 77, rating: 85.6 },   // Arkansas
  m5: { prob: 66, rating: 76.4 },   // Illinois
  m6: { prob: 63, rating: 74.0 },   // Arizona State
  m7: { prob: 56, rating: 67.2 },   // VCU
  m8: { prob: 53, rating: 64.5 },   // Iowa
  m9: { prob: 47, rating: 59.5 },   // Auburn
  m10: { prob: 44, rating: 57.3 },  // Penn State
  m11: { prob: 37, rating: 50.8 },  // Pittsburgh
  m12: { prob: 34, rating: 47.6 },  // Furman
  m13: { prob: 23, rating: 43.5 },  // UC Santa Barbara
  m14: { prob: 16, rating: 36.4 },  // Princeton
  m15: { prob: 11, rating: 30.9 },  // Vermont
  m16: { prob: 4, rating: 19.8 },   // N. Kentucky
}

export function getTeamPrediction(teamId: string): TeamPrediction | undefined {
  const data = MOCK_WIN_PROBS[teamId]
  if (!data) return undefined
  return {
    teamId,
    winProbability: data.prob,
    source: 'FiveThirtyEight',
    rating: data.rating,
  }
}

// ============================================================
// Mock Betting Odds (Round 1)
// Keyed by "team1Id:team2Id" (lower seed first)
// ============================================================

// Helper: build a moneyline from win probability
function probToMoneyline(prob: number): { fav: number; dog: number } {
  if (prob >= 50) {
    const fav = -Math.round((prob / (100 - prob)) * 100)
    const dog = Math.round(((100 - prob) / prob) * 100)
    return { fav, dog }
  } else {
    const dog = Math.round((prob / (100 - prob)) * 100)
    const fav = -Math.round(((100 - prob) / prob) * 100)
    return { fav, dog }
  }
}

// Seed-based spread approximation (very rough)
function seedsToSpread(favSeed: number, dogSeed: number): number {
  const diff = dogSeed - favSeed
  if (diff >= 15) return -25.5
  if (diff >= 13) return -20.5
  if (diff >= 11) return -16.5
  if (diff >= 9) return -13.5
  if (diff >= 7) return -10.5
  if (diff >= 5) return -7.5
  if (diff >= 3) return -4.5
  if (diff >= 2) return -2.5
  return -1.5
}

export function getMockOddsForMatchup(
  favTeamId: string,
  favTeamName: string,
  favSeed: number,
  dogSeed: number,
  favWinProb: number
): GameOdds {
  const spread = seedsToSpread(favSeed, dogSeed)
  const ml = probToMoneyline(favWinProb)
  const spreadLabel = `${favTeamName} ${spread}`
  const ou = Math.round(130 + Math.random() * 20) + 0.5 // rough O/U

  return {
    matchupKey: `${favSeed}v${dogSeed}`,
    favoriteTeamId: favTeamId,
    spread,
    spreadLabel,
    moneylineFav: ml.fav,
    moneylineDog: ml.dog,
    overUnder: ou,
    booksSource: 'The Odds API (mock)',
    updatedAt: new Date().toISOString(),
  }
}

// ============================================================
// The Odds API integration point
// Set ODDS_API_KEY in .env.local to enable
// ============================================================

export interface OddsAPIGame {
  id: string
  sport_key: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: Array<{
    key: string
    title: string
    markets: Array<{
      key: 'h2h' | 'spreads' | 'totals'
      outcomes: Array<{
        name: string
        price: number
        point?: number
      }>
    }>
  }>
}

export async function fetchOddsFromAPI(sportKey = 'basketball_ncaab'): Promise<OddsAPIGame[]> {
  const apiKey = process.env.ODDS_API_KEY
  if (!apiKey) {
    console.warn('[Predictions] ODDS_API_KEY not set — using mock data')
    return []
  }

  try {
    const res = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`,
      { next: { revalidate: 3600 } } // cache 1 hour
    )
    if (!res.ok) throw new Error(`Odds API error: ${res.status}`)
    return res.json()
  } catch (err) {
    console.error('[Predictions] Failed to fetch odds:', err)
    return []
  }
}

// ============================================================
// Crowd picks helpers
// ============================================================

export function computeCrowdPicks(
  picks: Record<string, string>[],
  gameId: string,
  team1Id: string,
  team2Id: string
): CrowdPickResult {
  let team1Count = 0
  let team2Count = 0

  for (const p of picks) {
    const pick = p[gameId]
    if (pick === team1Id) team1Count++
    else if (pick === team2Id) team2Count++
  }

  const total = team1Count + team2Count
  return {
    gameId,
    team1Id,
    team2Id,
    team1Pct: total > 0 ? Math.round((team1Count / total) * 100) : 50,
    team2Pct: total > 0 ? Math.round((team2Count / total) * 100) : 50,
    totalPicks: total,
  }
}

// Format moneyline for display
export function formatMoneyline(ml: number): string {
  return ml > 0 ? `+${ml}` : `${ml}`
}
