// Team details data structure
// Populate with real data before Selection Sunday
// Currently contains sample/mock data for UI development

export interface RecentGame {
  date: string
  opponent: string
  result: 'W' | 'L'
  score: string // e.g. "82-71" (team score first)
  isConferenceTournament?: boolean
  isTournament?: boolean
}

export interface KeyPlayer {
  name: string
  position: string
  ppg: number
  rpg: number
  apg: number
  jersey?: number
}

export interface TeamStats {
  ppg: number        // Points per game
  papg: number       // Points allowed per game
  sosRank: number    // Strength of schedule rank (1 = hardest)
  netRanking?: number
  kenpomRanking?: number
  fieldGoalPct?: number
  threePointPct?: number
  reboundsPerGame?: number
}

export interface SeedHistory {
  winPctRound1: number      // Win % in first round (0–1)
  allTimeTournRecord: string // e.g. "58-25"
  bestFinish: string         // e.g. "National Champion"
  upsetNote?: string         // e.g. "12-seeds beat 5-seeds 35% of the time"
}

export interface TeamDetail {
  teamId: string
  name: string
  abbreviation: string
  seed: number
  region: string
  conference: string
  record: string       // "28-6"
  primaryColor: string
  secondaryColor?: string
  stats: TeamStats
  recentGames: RecentGame[]
  conferenceTournResult?: string
  keyPlayers: KeyPlayer[]
  seedHistory: SeedHistory
}

// ─────────────────────────────────────────────
// Seed history lookup (historical NCAA data)
// These apply to any team with that seed
// ─────────────────────────────────────────────
export const SEED_HISTORY: Record<number, SeedHistory> = {
  1: {
    winPctRound1: 0.992,
    allTimeTournRecord: '159-3',
    bestFinish: 'National Champion',
    upsetNote: '1-seeds are 159-3 all-time in the first round (99.2%).',
  },
  2: {
    winPctRound1: 0.943,
    allTimeTournRecord: '136-8',
    bestFinish: 'National Champion',
    upsetNote: '2-seeds have been upset just 8 times in 144 first-round games.',
  },
  3: {
    winPctRound1: 0.854,
    allTimeTournRecord: '123-21',
    bestFinish: 'National Champion',
    upsetNote: '3-seeds win ~85% of first-round games but often fall in the Elite 8.',
  },
  4: {
    winPctRound1: 0.792,
    allTimeTournRecord: '114-30',
    bestFinish: 'National Champion',
    upsetNote: '4-seeds win about 4 in 5 first-round games.',
  },
  5: {
    winPctRound1: 0.653,
    allTimeTournRecord: '94-50',
    bestFinish: 'National Champion',
    upsetNote: '12-seeds have beaten 5-seeds 35% of the time historically — a classic upset pick.',
  },
  6: {
    winPctRound1: 0.618,
    allTimeTournRecord: '89-55',
    bestFinish: 'National Champion',
    upsetNote: '11-seeds upset 6-seeds ~38% of the time and are among the best Cinderella picks.',
  },
  7: {
    winPctRound1: 0.604,
    allTimeTournRecord: '87-57',
    bestFinish: 'Final Four',
    upsetNote: '10-seeds win about 39% of first-round matchups against 7-seeds.',
  },
  8: {
    winPctRound1: 0.493,
    allTimeTournRecord: '71-73',
    bestFinish: 'National Champion',
    upsetNote: '8 vs. 9 is nearly a coin flip — the closest seed matchup in the bracket.',
  },
  9: {
    winPctRound1: 0.507,
    allTimeTournRecord: '73-71',
    bestFinish: 'Elite 8',
    upsetNote: '9-seeds have a slight historical edge over 8-seeds in first-round play.',
  },
  10: {
    winPctRound1: 0.396,
    allTimeTournRecord: '57-87',
    bestFinish: 'Final Four',
    upsetNote: '10-seeds are a solid upset pick — they win ~40% of first-round games.',
  },
  11: {
    winPctRound1: 0.382,
    allTimeTournRecord: '55-89',
    bestFinish: 'Final Four',
    upsetNote: '11-seeds have produced some of the bracket\'s biggest Cinderella runs.',
  },
  12: {
    winPctRound1: 0.347,
    allTimeTournRecord: '50-94',
    bestFinish: 'Elite 8',
    upsetNote: '12-seeds beat 5-seeds roughly 1 in 3 times — a must-consider upset pick.',
  },
  13: {
    winPctRound1: 0.208,
    allTimeTournRecord: '30-114',
    bestFinish: 'Sweet 16',
    upsetNote: '13-seeds pull off upsets about 21% of the time.',
  },
  14: {
    winPctRound1: 0.153,
    allTimeTournRecord: '22-122',
    bestFinish: 'Sweet 16',
    upsetNote: '14-seeds rarely advance but have upset 3-seeds 15% of the time.',
  },
  15: {
    winPctRound1: 0.063,
    allTimeTournRecord: '9-135',
    bestFinish: 'Sweet 16',
    upsetNote: '15-seeds have beaten 2-seeds only 9 times in 144 attempts.',
  },
  16: {
    winPctRound1: 0.014,
    allTimeTournRecord: '2-134',
    bestFinish: 'Round of 32',
    upsetNote: '16-seeds have beaten 1-seeds twice: UMBC in 2018 and Fairleigh Dickinson in 2023.',
  },
}

// ─────────────────────────────────────────────
// Sample team details (mock data for dev)
// Add more teams here — any teamId not found
// will fall back to generated defaults
// ─────────────────────────────────────────────
export const TEAM_DETAILS: Record<string, Partial<TeamDetail>> = {
  // ── East Region ──────────────────────────
  e1: {
    conference: 'ACC',
    record: '29-5',
    stats: { ppg: 82.3, papg: 65.1, sosRank: 4, netRanking: 2, kenpomRanking: 3, fieldGoalPct: 48.2, threePointPct: 35.6, reboundsPerGame: 37.8 },
    recentGames: [
      { date: 'Mar 14', opponent: 'vs Florida State', result: 'W', score: '89-72', isConferenceTournament: true },
      { date: 'Mar 13', opponent: 'vs Miami', result: 'W', score: '78-65', isConferenceTournament: true },
      { date: 'Mar 12', opponent: 'vs Notre Dame', result: 'W', score: '81-63', isConferenceTournament: true },
      { date: 'Mar 8',  opponent: '@NC State', result: 'W', score: '77-60' },
      { date: 'Mar 5',  opponent: 'vs Clemson', result: 'W', score: '92-74' },
      { date: 'Mar 1',  opponent: '@Virginia', result: 'W', score: '68-55' },
      { date: 'Feb 26', opponent: 'vs Wake Forest', result: 'W', score: '84-59' },
      { date: 'Feb 22', opponent: '@Louisville', result: 'W', score: '73-61' },
    ],
    conferenceTournResult: 'ACC Tournament Champion',
    keyPlayers: [
      { name: 'Kyle Filipowski', position: 'C', ppg: 15.1, rpg: 8.8, apg: 2.4, jersey: 3 },
      { name: 'Tyrese Proctor', position: 'G', ppg: 13.6, rpg: 3.2, apg: 4.7, jersey: 5 },
      { name: 'Jeremy Roach', position: 'G', ppg: 12.4, rpg: 2.8, apg: 4.1, jersey: 3 },
    ],
  },

  e5: {
    conference: 'Big Ten',
    record: '20-13',
    stats: { ppg: 72.4, papg: 68.9, sosRank: 22, netRanking: 38, kenpomRanking: 42, fieldGoalPct: 44.1, threePointPct: 33.2, reboundsPerGame: 35.2 },
    recentGames: [
      { date: 'Mar 15', opponent: 'vs Rutgers', result: 'W', score: '74-66', isConferenceTournament: true },
      { date: 'Mar 14', opponent: 'vs Minnesota', result: 'W', score: '80-72', isConferenceTournament: true },
      { date: 'Mar 11', opponent: '@Ohio State', result: 'L', score: '69-71' },
      { date: 'Mar 7',  opponent: 'vs Indiana', result: 'W', score: '65-62' },
      { date: 'Mar 4',  opponent: '@Illinois', result: 'L', score: '70-75' },
      { date: 'Feb 28', opponent: 'vs Penn State', result: 'W', score: '83-71' },
      { date: 'Feb 24', opponent: '@Michigan', result: 'L', score: '61-67' },
      { date: 'Feb 20', opponent: 'vs Maryland', result: 'W', score: '77-68' },
    ],
    conferenceTournResult: 'Big Ten Tournament — Round of 32',
    keyPlayers: [
      { name: 'Tyson Walker', position: 'G', ppg: 16.2, rpg: 2.7, apg: 3.5, jersey: 2 },
      { name: 'Malik Hall', position: 'F', ppg: 11.8, rpg: 5.4, apg: 2.1, jersey: 25 },
      { name: 'Jaden Akins', position: 'G', ppg: 10.3, rpg: 3.9, apg: 1.8, jersey: 3 },
    ],
  },

  e12: {
    conference: 'Summit League',
    record: '30-6',
    stats: { ppg: 78.6, papg: 67.2, sosRank: 198, netRanking: 67, kenpomRanking: 72, fieldGoalPct: 47.8, threePointPct: 37.4, reboundsPerGame: 36.1 },
    recentGames: [
      { date: 'Mar 11', opponent: 'vs North Dakota St', result: 'W', score: '85-72', isConferenceTournament: true },
      { date: 'Mar 10', opponent: 'vs Western Illinois', result: 'W', score: '92-64', isConferenceTournament: true },
      { date: 'Mar 9',  opponent: 'vs Denver', result: 'W', score: '77-61', isConferenceTournament: true },
      { date: 'Mar 7',  opponent: '@Kansas City', result: 'W', score: '88-73' },
      { date: 'Mar 3',  opponent: 'vs Fort Wayne', result: 'W', score: '96-78' },
      { date: 'Feb 28', opponent: '@South Dakota St', result: 'L', score: '73-80' },
      { date: 'Feb 24', opponent: 'vs NDSU', result: 'W', score: '81-69' },
      { date: 'Feb 21', opponent: '@Denver', result: 'W', score: '79-65' },
    ],
    conferenceTournResult: 'Summit League Champion (auto bid)',
    keyPlayers: [
      { name: 'Kareem Thompson', position: 'G', ppg: 20.4, rpg: 4.1, apg: 3.2, jersey: 11 },
      { name: 'Max Abmas', position: 'G', ppg: 17.8, rpg: 2.9, apg: 4.5, jersey: 3 },
      { name: 'DeShang Weaver', position: 'F', ppg: 12.1, rpg: 7.4, apg: 1.3, jersey: 22 },
    ],
  },

  // ── West Region ──────────────────────────
  w1: {
    conference: 'Big 12',
    record: '28-6',
    stats: { ppg: 79.8, papg: 64.3, sosRank: 3, netRanking: 4, kenpomRanking: 4, fieldGoalPct: 47.1, threePointPct: 34.8, reboundsPerGame: 38.4 },
    recentGames: [
      { date: 'Mar 15', opponent: 'vs Texas', result: 'W', score: '83-74', isConferenceTournament: true },
      { date: 'Mar 14', opponent: 'vs Baylor', result: 'W', score: '76-65', isConferenceTournament: true },
      { date: 'Mar 13', opponent: 'vs TCU', result: 'L', score: '71-73', isConferenceTournament: true },
      { date: 'Mar 9',  opponent: '@Kansas State', result: 'W', score: '80-67' },
      { date: 'Mar 5',  opponent: 'vs West Virginia', result: 'W', score: '74-58' },
      { date: 'Mar 1',  opponent: '@Iowa State', result: 'W', score: '86-71' },
      { date: 'Feb 25', opponent: 'vs Texas Tech', result: 'W', score: '69-61' },
      { date: 'Feb 21', opponent: '@Oklahoma', result: 'W', score: '78-52' },
    ],
    conferenceTournResult: 'Big 12 Tournament — Semifinals',
    keyPlayers: [
      { name: 'Dajuan Harris Jr.', position: 'G', ppg: 10.4, rpg: 3.2, apg: 5.8, jersey: 3 },
      { name: 'Gradey Dick', position: 'G', ppg: 14.1, rpg: 4.5, apg: 1.9, jersey: 4 },
      { name: 'Jalen Wilson', position: 'F', ppg: 20.1, rpg: 8.3, apg: 2.6, jersey: 10 },
    ],
  },

  // ── South Region ──────────────────────────
  s1: {
    conference: 'SEC',
    record: '31-5',
    stats: { ppg: 87.2, papg: 66.7, sosRank: 8, netRanking: 1, kenpomRanking: 1, fieldGoalPct: 50.1, threePointPct: 38.2, reboundsPerGame: 40.1 },
    recentGames: [
      { date: 'Mar 12', opponent: 'vs Tennessee', result: 'W', score: '94-86', isConferenceTournament: true },
      { date: 'Mar 11', opponent: 'vs Mississippi St', result: 'W', score: '101-75', isConferenceTournament: true },
      { date: 'Mar 10', opponent: 'vs LSU', result: 'W', score: '92-71', isConferenceTournament: true },
      { date: 'Mar 7',  opponent: '@Kentucky', result: 'W', score: '81-68' },
      { date: 'Mar 3',  opponent: 'vs Missouri', result: 'W', score: '96-72' },
      { date: 'Feb 28', opponent: '@Florida', result: 'W', score: '78-61' },
      { date: 'Feb 25', opponent: 'vs Georgia', result: 'W', score: '88-59' },
      { date: 'Feb 22', opponent: '@South Carolina', result: 'L', score: '67-71' },
    ],
    conferenceTournResult: 'SEC Tournament Champion',
    keyPlayers: [
      { name: 'Brandon Miller', position: 'F', ppg: 18.8, rpg: 8.4, apg: 2.0, jersey: 24 },
      { name: 'Mark Sears', position: 'G', ppg: 14.9, rpg: 3.1, apg: 5.2, jersey: 1 },
      { name: 'Nimari Burnett', position: 'G', ppg: 11.2, rpg: 2.8, apg: 2.4, jersey: 25 },
    ],
  },

  // ── Midwest Region ──────────────────────────
  m1: {
    conference: 'American Athletic',
    record: '33-3',
    stats: { ppg: 74.1, papg: 58.9, sosRank: 12, netRanking: 3, kenpomRanking: 2, fieldGoalPct: 45.8, threePointPct: 32.6, reboundsPerGame: 36.7 },
    recentGames: [
      { date: 'Mar 12', opponent: 'vs Memphis', result: 'W', score: '82-69', isConferenceTournament: true },
      { date: 'Mar 11', opponent: 'vs UCF', result: 'W', score: '71-55', isConferenceTournament: true },
      { date: 'Mar 10', opponent: 'vs Tulane', result: 'W', score: '78-64', isConferenceTournament: true },
      { date: 'Mar 5',  opponent: '@Wichita State', result: 'W', score: '64-52' },
      { date: 'Mar 1',  opponent: 'vs Temple', result: 'W', score: '81-53' },
      { date: 'Feb 26', opponent: '@East Carolina', result: 'W', score: '74-61' },
      { date: 'Feb 22', opponent: 'vs Tulsa', result: 'W', score: '83-58' },
      { date: 'Feb 19', opponent: '@South Florida', result: 'W', score: '70-61' },
    ],
    conferenceTournResult: 'AAC Tournament Champion',
    keyPlayers: [
      { name: 'Marcus Sasser', position: 'G', ppg: 17.7, rpg: 2.8, apg: 3.1, jersey: 0 },
      { name: 'Jamal Shead', position: 'G', ppg: 11.4, rpg: 4.0, apg: 6.5, jersey: 1 },
      { name: "Emanuel Sharp", position: 'G', ppg: 10.8, rpg: 3.6, apg: 2.2, jersey: 21 },
    ],
  },

  m14: {
    conference: 'Ivy League',
    record: '23-10',
    stats: { ppg: 69.2, papg: 65.4, sosRank: 224, netRanking: 148, kenpomRanking: 152, fieldGoalPct: 43.6, threePointPct: 34.1, reboundsPerGame: 34.8 },
    recentGames: [
      { date: 'Mar 11', opponent: 'vs Penn', result: 'W', score: '78-66', isConferenceTournament: true },
      { date: 'Mar 10', opponent: 'vs Yale', result: 'W', score: '64-62', isConferenceTournament: true },
      { date: 'Mar 7',  opponent: '@Dartmouth', result: 'W', score: '71-58' },
      { date: 'Mar 4',  opponent: 'vs Cornell', result: 'W', score: '80-61' },
      { date: 'Feb 28', opponent: '@Columbia', result: 'L', score: '55-62' },
      { date: 'Feb 25', opponent: 'vs Penn', result: 'W', score: '72-67' },
      { date: 'Feb 22', opponent: '@Harvard', result: 'L', score: '59-64' },
      { date: 'Feb 18', opponent: 'vs Brown', result: 'W', score: '76-58' },
    ],
    conferenceTournResult: 'Ivy League Champion (auto bid)',
    keyPlayers: [
      { name: 'Tosan Evbuomwan', position: 'F', ppg: 16.9, rpg: 7.2, apg: 3.8, jersey: 21 },
      { name: 'Xander Rice', position: 'G', ppg: 13.5, rpg: 2.9, apg: 3.2, jersey: 11 },
      { name: 'Caden Pierce', position: 'C', ppg: 9.8, rpg: 6.4, apg: 0.7, jersey: 33 },
    ],
  },
}

/**
 * Get full team detail, merging stored data with seed-history defaults.
 * Returns null if teamId is completely unknown.
 */
export function getTeamDetail(
  teamId: string,
  name: string,
  abbreviation: string,
  seed: number,
  region: string,
  primaryColor?: string
): TeamDetail {
  const stored = TEAM_DETAILS[teamId] ?? {}

  return {
    teamId,
    name: stored.name ?? name,
    abbreviation: stored.abbreviation ?? abbreviation,
    seed: stored.seed ?? seed,
    region: stored.region ?? region,
    conference: stored.conference ?? 'Conference TBD',
    record: stored.record ?? '—',
    primaryColor: stored.primaryColor ?? primaryColor ?? '#444444',
    secondaryColor: stored.secondaryColor,
    stats: stored.stats ?? {
      ppg: 0,
      papg: 0,
      sosRank: 0,
      netRanking: undefined,
      kenpomRanking: undefined,
    },
    recentGames: stored.recentGames ?? [],
    conferenceTournResult: stored.conferenceTournResult ?? 'Conference Tournament Result TBD',
    keyPlayers: stored.keyPlayers ?? [],
    seedHistory: SEED_HISTORY[seed] ?? SEED_HISTORY[8],
  }
}
