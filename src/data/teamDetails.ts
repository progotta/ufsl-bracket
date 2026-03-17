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
// Records + player stats scraped from ESPN.com
// ─────────────────────────────────────────────
export const TEAM_DETAILS: Record<string, Partial<TeamDetail>> = {
  // ── East Region ──────────────────────────
  'e1':  { conference: 'ACC',                record: '32-2',  keyPlayers: [{ name: 'Cameron Boozer',        position: 'F', ppg: 22.5, rpg: 10.2, apg: 4.2, jersey: 12 }] },
  'e2':  { conference: 'Big East',           record: '29-5',  keyPlayers: [{ name: 'Tarris Reed Jr.',       position: 'C', ppg: 13.7, rpg: 8.1,  apg: 0,   jersey: 0  }] },
  'e3':  { conference: 'Big Ten',            record: '25-7',  keyPlayers: [{ name: 'Jeremy Fears Jr.',      position: 'G', ppg: 15.7, rpg: 0,    apg: 9.2, jersey: 0  }] },
  'e4':  { conference: 'Big 12',             record: '23-10', keyPlayers: [{ name: 'Tre White',             position: 'G', ppg: 13.8, rpg: 0,    apg: 0,   jersey: 0  }] },
  'e5':  { conference: 'Big East',           record: '28-6',  keyPlayers: [{ name: 'Zuby Ejiofor',          position: 'F', ppg: 16.3, rpg: 7.1,  apg: 3.5, jersey: 0  }] },
  'e6':  { conference: 'ACC',                record: '23-10', keyPlayers: [{ name: 'Ryan Conwell',          position: 'G', ppg: 18.7, rpg: 0,    apg: 0,   jersey: 0  }] },
  'e7':  { conference: 'Big Ten',            record: '23-11', keyPlayers: [{ name: 'Tyler Bilodeau',        position: 'F', ppg: 17.6, rpg: 0,    apg: 0,   jersey: 0  }] },
  'e8':  { conference: 'Big Ten',            record: '21-12', keyPlayers: [{ name: 'Bruce Thornton',        position: 'G', ppg: 20.2, rpg: 0,    apg: 3.9, jersey: 0  }] },
  'e9':  { conference: 'Big 12',             record: '22-11', keyPlayers: [{ name: 'David Punch',           position: 'F', ppg: 14.3, rpg: 6.7,  apg: 0,   jersey: 0  }] },
  'e10': { conference: 'Big 12',             record: '21-11', keyPlayers: [{ name: 'Riley Kugel',           position: 'G', ppg: 14.4, rpg: 0,    apg: 0,   jersey: 0  }] },
  'e11': { conference: 'American',           record: '25-8',  keyPlayers: [{ name: 'Wes Enis',              position: 'G', ppg: 16.8, rpg: 0,    apg: 0,   jersey: 0  }] },
  'e12': { conference: 'MVC',               record: '23-12', keyPlayers: [{ name: 'Trey Campbell',         position: 'G', ppg: 13.7, rpg: 0,    apg: 3.9, jersey: 0  }] },
  'e13': { conference: 'WAC',               record: '25-8',  keyPlayers: [{ name: 'Dominique Daniels Jr.', position: 'G', ppg: 23.2, rpg: 0,    apg: 3.2, jersey: 0  }] },
  'e14': { conference: 'Summit',            record: '27-7',  keyPlayers: [{ name: 'Damari Wheeler-Thomas', position: 'G', ppg: 14.4, rpg: 0,    apg: 0,   jersey: 0  }] },
  'e15': { conference: 'SoCon',             record: '22-12', keyPlayers: [{ name: 'Alex Wilkins',          position: 'G', ppg: 17.7, rpg: 0,    apg: 4.7, jersey: 0  }] },
  'e16': { conference: 'MAAC',              record: '23-11', keyPlayers: [{ name: 'Gavin Doty',            position: 'G', ppg: 17.9, rpg: 7.0,  apg: 0,   jersey: 0  }] },
  // ── West Region ──────────────────────────
  'w1':  { conference: 'Big 12',            record: '32-2',  keyPlayers: [{ name: 'Brayden Burries',       position: 'G', ppg: 15.9, rpg: 0,    apg: 0,   jersey: 0  }] },
  'w2':  { conference: 'Big Ten',           record: '27-8',  keyPlayers: [{ name: 'Braden Smith',          position: 'G', ppg: 14.0, rpg: 0,    apg: 9.1, jersey: 3  }] },
  'w3':  { conference: 'WCC',              record: '30-3',  keyPlayers: [{ name: 'Graham Ike',            position: 'F', ppg: 19.7, rpg: 8.2,  apg: 0,   jersey: 0  }] },
  'w4':  { conference: 'SEC',              record: '26-8',  keyPlayers: [{ name: 'Darius Acuff Jr.',      position: 'G', ppg: 22.9, rpg: 0,    apg: 6.5, jersey: 5  }] },
  'w5':  { conference: 'Big Ten',          record: '24-10', keyPlayers: [{ name: 'Nick Boyd',             position: 'G', ppg: 20.6, rpg: 0,    apg: 4.2, jersey: 0  }] },
  'w6':  { conference: 'Big 12',           record: '23-11', keyPlayers: [{ name: 'AJ Dybantsa',           position: 'F', ppg: 25.3, rpg: 0,    apg: 0,   jersey: 0  }] },
  'w7':  { conference: 'ACC',              record: '25-8',  keyPlayers: [{ name: 'Malik Reneau',          position: 'F', ppg: 18.8, rpg: 0,    apg: 0,   jersey: 0  }] },
  'w8':  { conference: 'Big East',         record: '24-8',  keyPlayers: [{ name: 'Tyler Perkins',         position: 'G', ppg: 13.7, rpg: 0,    apg: 0,   jersey: 0  }] },
  'w9':  { conference: 'Mountain West',    record: '28-6',  keyPlayers: [{ name: 'MJ Collins Jr.',        position: 'G', ppg: 17.6, rpg: 0,    apg: 0,   jersey: 0  }] },
  'w10': { conference: 'SEC',              record: '20-12', keyPlayers: [{ name: 'Mark Mitchell',         position: 'G', ppg: 18.3, rpg: 5.2,  apg: 3.6, jersey: 0  }] },
  'w11': { conference: 'ACC / Big 12',     record: '—' },
  'w12': { conference: 'Big South',        record: '30-4',  keyPlayers: [{ name: 'Terry Anderson',        position: 'F', ppg: 16.0, rpg: 6.0,  apg: 0,   jersey: 0  }] },
  'w13': { conference: 'Big West',         record: '24-8',  keyPlayers: [{ name: 'Isaac Johnson',         position: 'C', ppg: 14.1, rpg: 0,    apg: 0,   jersey: 0  }] },
  'w14': { conference: 'ASUN',             record: '—',     keyPlayers: [{ name: 'Jonathan Grimsley',     position: 'G', ppg: 27.0, rpg: 6.0,  apg: 0,   jersey: 0  }] },
  'w15': { conference: 'ASUN',             record: '21-13', keyPlayers: [{ name: 'Nasir Mann',            position: 'G', ppg: 13.4, rpg: 5.8,  apg: 0,   jersey: 0  }] },
  'w16': { conference: 'NEC',              record: '24-10', keyPlayers: [{ name: 'Jamal Fuller',          position: 'G', ppg: 16.4, rpg: 0,    apg: 0,   jersey: 0  }] },
  // ── South Region ──────────────────────────
  's1':  { conference: 'SEC',              record: '26-7',  keyPlayers: [{ name: 'Thomas Haugh',          position: 'F', ppg: 17.1, rpg: 0,    apg: 0,   jersey: 0  }] },
  's2':  { conference: 'Big 12',           record: '28-6',  keyPlayers: [{ name: 'Kingston Flemings',     position: 'G', ppg: 16.4, rpg: 0,    apg: 5.3, jersey: 0  }] },
  's3':  { conference: 'Big Ten',          record: '24-8',  keyPlayers: [{ name: 'Keaton Wagler',         position: 'G', ppg: 17.9, rpg: 0,    apg: 4.4, jersey: 0  }] },
  's4':  { conference: 'Big Ten',          record: '26-6',  keyPlayers: [{ name: 'Pryce Sandfort',        position: 'F', ppg: 17.8, rpg: 0,    apg: 0,   jersey: 0  }] },
  's5':  { conference: 'SEC',              record: '26-8',  keyPlayers: [{ name: 'Tyler Tanner',          position: 'G', ppg: 19.1, rpg: 0,    apg: 5.1, jersey: 0  }] },
  's6':  { conference: 'ACC',              record: '24-8',  keyPlayers: [{ name: 'Caleb Wilson',          position: 'F', ppg: 19.8, rpg: 9.4,  apg: 2.7, jersey: 0  }] },
  's7':  { conference: 'WCC',              record: '27-5',  keyPlayers: [{ name: 'Paulius Murauskas',     position: 'F', ppg: 18.8, rpg: 0,    apg: 0,   jersey: 0  }] },
  's8':  { conference: 'ACC',              record: '24-10', keyPlayers: [{ name: 'RJ Godfrey',            position: 'F', ppg: 11.9, rpg: 0,    apg: 0,   jersey: 0  }] },
  's9':  { conference: 'Big Ten',          record: '21-12', keyPlayers: [{ name: 'Bennett Stirtz',        position: 'G', ppg: 20.0, rpg: 0,    apg: 4.5, jersey: 0  }] },
  's10': { conference: 'SEC',              record: '21-11', keyPlayers: [{ name: 'Rashaun Agee',          position: 'F', ppg: 14.7, rpg: 8.9,  apg: 0,   jersey: 0  }] },
  's11': { conference: 'A-10',             record: '27-7',  keyPlayers: [{ name: 'Terrence Hill Jr.',     position: 'G', ppg: 14.4, rpg: 0,    apg: 2.8, jersey: 0  }] },
  's12': { conference: 'Southland',        record: '28-5',  keyPlayers: [{ name: 'Larry Johnson',         position: 'G', ppg: 17.5, rpg: 5.5,  apg: 0,   jersey: 0  }] },
  's13': { conference: 'Sun Belt',         record: '22-11', keyPlayers: [{ name: 'Victor Valdes',         position: 'F', ppg: 14.8, rpg: 0,    apg: 4.6, jersey: 0  }] },
  's14': { conference: 'Ivy',              record: '18-11', keyPlayers: [{ name: 'Ethan Roberts',         position: 'F', ppg: 16.9, rpg: 0,    apg: 0,   jersey: 0  }] },
  's15': { conference: 'Big Sky',          record: '21-14', keyPlayers: [{ name: 'Jackson Rasmussen',     position: 'F', ppg: 13.9, rpg: 0,    apg: 0,   jersey: 0  }] },
  's16': { conference: 'Patriot / SWAC',   record: '—' },
  // ── Midwest Region ──────────────────────────
  'm1':  { conference: 'Big Ten',          record: '31-3',  keyPlayers: [{ name: 'Yaxel Lendeborg',       position: 'F', ppg: 14.6, rpg: 0,    apg: 0,   jersey: 0  }] },
  'm2':  { conference: 'Big 12',           record: '27-7',  keyPlayers: [{ name: 'Milan Momcilovic',      position: 'F', ppg: 17.1, rpg: 0,    apg: 0,   jersey: 0  }] },
  'm3':  { conference: 'ACC',              record: '29-5',  keyPlayers: [{ name: 'Thijs De Ridder',       position: 'F', ppg: 15.5, rpg: 6.2,  apg: 0,   jersey: 0  }] },
  'm4':  { conference: 'SEC',              record: '23-9',  keyPlayers: [{ name: 'Labaron Philon Jr.',    position: 'G', ppg: 21.7, rpg: 0,    apg: 4.7, jersey: 0  }] },
  'm5':  { conference: 'Big 12',           record: '22-10', keyPlayers: [{ name: 'JT Toppin',             position: 'F', ppg: 21.8, rpg: 10.8, apg: 0,   jersey: 0  }] },
  'm6':  { conference: 'SEC',              record: '22-11', keyPlayers: [{ name: "Ja'Kobi Gillespie",   position: 'G', ppg: 18.0, rpg: 0,    apg: 5.5, jersey: 0  }] },
  'm7':  { conference: 'SEC',              record: '21-13', keyPlayers: [{ name: 'Otega Oweh',            position: 'G', ppg: 18.2, rpg: 0,    apg: 0,   jersey: 0  }] },
  'm8':  { conference: 'SEC',              record: '22-10', keyPlayers: [{ name: 'Jeremiah Wilkinson',    position: 'G', ppg: 17.0, rpg: 0,    apg: 0,   jersey: 0  }] },
  'm9':  { conference: 'A-10',             record: '28-5',  keyPlayers: [{ name: 'Robbie Avila',          position: 'C', ppg: 12.9, rpg: 0,    apg: 4.1, jersey: 0  }] },
  'm10': { conference: 'WCC',              record: '26-8',  keyPlayers: [{ name: 'Christian Hammond',     position: 'G', ppg: 15.8, rpg: 0,    apg: 0,   jersey: 0  }] },
  'm11': { conference: 'AAC / MAC',        record: '—' },
  'm12': { conference: 'MAC',              record: '29-5',  keyPlayers: [{ name: 'Tavari Johnson',        position: 'G', ppg: 20.1, rpg: 0,    apg: 5.0, jersey: 0  }] },
  'm13': { conference: 'CAA',              record: '24-10', keyPlayers: [{ name: 'Cruz Davis',            position: 'G', ppg: 20.2, rpg: 0,    apg: 4.6, jersey: 0  }] },
  'm14': { conference: 'Horizon',          record: '23-11', keyPlayers: [{ name: 'Michael Cooper',        position: 'G', ppg: 13.4, rpg: 0,    apg: 0,   jersey: 0  }] },
  'm15': { conference: 'OVC',              record: '23-9',  keyPlayers: [{ name: 'Aaron Nkrumah',         position: 'G', ppg: 17.6, rpg: 0,    apg: 0,   jersey: 0  }] },
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
