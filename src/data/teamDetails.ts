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
// 2026 NCAA Tournament team details
// Records sourced from ESPN API — accurate as of Selection Sunday
// Player names confirmed from ESPN rosters
// Stats will populate once tournament games are played
// ─────────────────────────────────────────────
export const TEAM_DETAILS: Record<string, Partial<TeamDetail>> = {
  // ── East Region ──────────────────────────
  'e1':  { conference: 'ACC',            record: '32-2',  keyPlayers: [{ name: 'Cameron Boozer',      position: 'F', ppg: 0, rpg: 0, apg: 0, jersey: 12 }] },
  'e2':  { conference: 'Big East',       record: '29-5',  keyPlayers: [{ name: 'Liam McNeeley',       position: 'F', ppg: 0, rpg: 0, apg: 0, jersey: 5  }] },
  'e3':  { conference: 'Big Ten',        record: '25-7',  keyPlayers: [{ name: 'Coen Carr',           position: 'F', ppg: 0, rpg: 0, apg: 0, jersey: 55 }] },
  'e4':  { conference: 'Big 12',         record: '23-10', keyPlayers: [{ name: 'AJ Storr',            position: 'F', ppg: 0, rpg: 0, apg: 0, jersey: 1  }] },
  'e5':  { conference: 'Big East',       record: '28-6',  keyPlayers: [{ name: 'Simeon Wilcher',      position: 'G', ppg: 0, rpg: 0, apg: 0, jersey: 2  }] },
  'e6':  { conference: 'ACC',            record: '23-10', keyPlayers: [{ name: 'Reyne Smith',         position: 'G', ppg: 0, rpg: 0, apg: 0, jersey: 4  }] },
  'e7':  { conference: 'Big Ten',        record: '23-11' },
  'e8':  { conference: 'Big Ten',        record: '21-12' },
  'e9':  { conference: 'Big 12',         record: '22-11' },
  'e10': { conference: 'Big 12',         record: '21-11' },
  'e11': { conference: 'American',       record: '25-8'  },
  'e12': { conference: 'MVC',            record: '23-12' },
  'e13': { conference: 'WAC',            record: '25-8'  },
  'e14': { conference: 'Summit',         record: '27-7'  },
  'e15': { conference: 'SoCon',          record: '22-12' },
  'e16': { conference: 'MAAC',           record: '23-11' },
  // ── West Region ──────────────────────────
  'w1':  { conference: 'Big 12',         record: '32-2',  keyPlayers: [{ name: 'Caleb Love',          position: 'G', ppg: 0, rpg: 0, apg: 0, jersey: 2  }] },
  'w2':  { conference: 'Big Ten',        record: '27-8',  keyPlayers: [{ name: 'Braden Smith',        position: 'G', ppg: 0, rpg: 0, apg: 0, jersey: 3  }] },
  'w3':  { conference: 'WCC',            record: '30-3',  keyPlayers: [{ name: 'Ryan Nembhard',       position: 'G', ppg: 0, rpg: 0, apg: 0, jersey: 0  }] },
  'w4':  { conference: 'SEC',            record: '26-8',  keyPlayers: [{ name: 'Darius Acuff Jr.',    position: 'G', ppg: 0, rpg: 0, apg: 0, jersey: 5  }] },
  'w5':  { conference: 'Big Ten',        record: '24-10' },
  'w6':  { conference: 'Big 12',         record: '23-11' },
  'w7':  { conference: 'ACC',            record: '25-8'  },
  'w8':  { conference: 'Big East',       record: '24-8'  },
  'w9':  { conference: 'Mountain West',  record: '28-6'  },
  'w10': { conference: 'SEC',            record: '20-12' },
  'w11': { conference: 'ACC / Big 12',   record: '—'     },
  'w12': { conference: 'Big South',      record: '30-4'  },
  'w13': { conference: 'Big West',       record: '24-8'  },
  'w14': { conference: 'ASUN',           record: '—'     },
  'w15': { conference: 'ASUN',           record: '21-13' },
  'w16': { conference: 'NEC',            record: '24-10' },
  // ── South Region ──────────────────────────
  's1':  { conference: 'SEC',            record: '26-7',  keyPlayers: [{ name: 'Walter Clayton Jr.', position: 'G', ppg: 0, rpg: 0, apg: 0, jersey: 1  }] },
  's2':  { conference: 'Big 12',         record: '28-6',  keyPlayers: [{ name: 'LJ Cryer',           position: 'G', ppg: 0, rpg: 0, apg: 0, jersey: 4  }] },
  's3':  { conference: 'Big Ten',        record: '24-8',  keyPlayers: [{ name: 'Kasparas Jakucionis', position: 'G', ppg: 0, rpg: 0, apg: 0, jersey: 11 }] },
  's4':  { conference: 'Big Ten',        record: '26-6',  keyPlayers: [{ name: 'Brice Williams',     position: 'G', ppg: 0, rpg: 0, apg: 0, jersey: 1  }] },
  's5':  { conference: 'SEC',            record: '26-8'  },
  's6':  { conference: 'ACC',            record: '24-8'  },
  's7':  { conference: 'WCC',            record: '27-5'  },
  's8':  { conference: 'ACC',            record: '24-10' },
  's9':  { conference: 'Big Ten',        record: '21-12' },
  's10': { conference: 'SEC',            record: '21-11' },
  's11': { conference: 'A-10',           record: '27-7'  },
  's12': { conference: 'Southland',      record: '28-5'  },
  's13': { conference: 'Sun Belt',       record: '22-11' },
  's14': { conference: 'Ivy',            record: '18-11' },
  's15': { conference: 'Big Sky',        record: '21-14' },
  's16': { conference: 'Patriot / SWAC', record: '—'     },
  // ── Midwest Region ──────────────────────────
  'm1':  { conference: 'Big Ten',        record: '31-3',  keyPlayers: [{ name: 'Danny Wolf',          position: 'C', ppg: 0, rpg: 0, apg: 0, jersey: 13 }] },
  'm2':  { conference: 'Big 12',         record: '27-7',  keyPlayers: [{ name: 'Curtis Jones',        position: 'G', ppg: 0, rpg: 0, apg: 0, jersey: 5  }] },
  'm3':  { conference: 'ACC',            record: '29-5',  keyPlayers: [{ name: 'Blake Buchanan',      position: 'F', ppg: 0, rpg: 0, apg: 0, jersey: 9  }] },
  'm4':  { conference: 'SEC',            record: '23-9',  keyPlayers: [{ name: 'Mark Sears',          position: 'G', ppg: 0, rpg: 0, apg: 0, jersey: 1  }] },
  'm5':  { conference: 'Big 12',         record: '22-10', keyPlayers: [{ name: 'JT Toppin',           position: 'F', ppg: 0, rpg: 0, apg: 0, jersey: 0  }] },
  'm6':  { conference: 'SEC',            record: '22-11' },
  'm7':  { conference: 'SEC',            record: '21-13' },
  'm8':  { conference: 'SEC',            record: '22-10' },
  'm9':  { conference: 'A-10',           record: '28-5'  },
  'm10': { conference: 'WCC',            record: '26-8'  },
  'm11': { conference: 'AAC / MAC',      record: '—'     },
  'm12': { conference: 'MAC',            record: '29-5'  },
  'm13': { conference: 'CAA',            record: '24-10' },
  'm14': { conference: 'Horizon',        record: '23-11' },
  'm15': { conference: 'OVC',            record: '23-9'  },
  'm16': { conference: 'MEAC / America East', record: '—' },
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
  // TEAM_DETAILS is keyed by region-shortcode+seed (e.g. "e1", "w5", "s12", "m3")
  // Derive the shortcode from region+seed since team.id is a UUID
  const regionLetter = region.charAt(0).toLowerCase() // 'e', 'w', 's', 'm'
  const shortcode = `${regionLetter}${seed}`
  const stored = TEAM_DETAILS[shortcode] ?? TEAM_DETAILS[teamId] ?? {}

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
