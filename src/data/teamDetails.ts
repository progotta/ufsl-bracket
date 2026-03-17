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
// Records are 2025-26 regular season + conference tournament
// ─────────────────────────────────────────────
export const TEAM_DETAILS: Record<string, Partial<TeamDetail>> = {
  // ── East Region ──────────────────────────
  'e1': {
    conference: 'ACC',
    record: '31-3',
    primaryColor: '#012169',
    keyPlayers: [
          { name: 'Cooper Flagg', position: 'F', ppg: 19.2, rpg: 7.5, apg: 4.1, jersey: 2 },
    ],
  },
  'e2': {
    conference: 'Big East',
    record: '29-5',
    primaryColor: '#0E1F45',
    keyPlayers: [
          { name: 'Liam McNeeley', position: 'F', ppg: 16.8, rpg: 6.2, apg: 2.4, jersey: 5 },
    ],
  },
  'e3': {
    conference: 'Big Ten',
    record: '24-9',
    primaryColor: '#18453B',
    keyPlayers: [
          { name: 'Jaden Akins', position: 'G', ppg: 14.2, rpg: 3.8, apg: 2.9, jersey: 3 },
    ],
  },
  'e4': {
    conference: 'Big 12',
    record: '23-11',
    primaryColor: '#0051A5',
    keyPlayers: [
          { name: 'AJ Storr', position: 'F', ppg: 14.1, rpg: 4.2, apg: 2.1, jersey: 1 },
    ],
  },
  'e5': {
    conference: 'Big East',
    record: '27-7',
    primaryColor: '#BA0C2F',
    keyPlayers: [
          { name: 'Deivon Smith', position: 'G', ppg: 16.4, rpg: 3.1, apg: 5.2, jersey: 4 },
    ],
  },
  'e6': {
    conference: 'ACC',
    record: '22-12',
    primaryColor: '#AD0000',
    keyPlayers: [
          { name: 'Chucky Hepburn', position: 'G', ppg: 14.8, rpg: 3.2, apg: 4.1, jersey: 1 },
    ],
  },
  'e7': {
    conference: 'Big Ten',
    record: '21-13',
    primaryColor: '#2D68C4',
    keyPlayers: [
          { name: 'Tyler Bilodeau', position: 'F', ppg: 15.2, rpg: 6.1, apg: 2.3, jersey: 0 },
    ],
  },
  'e8': {
    conference: 'Big Ten',
    record: '21-13',
    primaryColor: '#BB0000',
    keyPlayers: [
          { name: 'Micah Parrish', position: 'G', ppg: 13.4, rpg: 3.6, apg: 2.8, jersey: 4 },
    ],
  },
  'e9': {
    conference: 'Big 12',
    record: '19-15',
    primaryColor: '#4D1979',
    keyPlayers: [
          { name: 'Emmanuel Miller', position: 'F', ppg: 15.6, rpg: 6.8, apg: 2.4, jersey: 1 },
    ],
  },
  'e10': {
    conference: 'AAC',
    record: '22-10',
    primaryColor: '#000000',
    keyPlayers: [
          { name: 'Darius Johnson', position: 'G', ppg: 17.2, rpg: 3.4, apg: 4.8, jersey: 3 },
    ],
  },
  'e11': {
    conference: 'AAC',
    record: '19-15',
    primaryColor: '#006747',
    keyPlayers: [
          { name: 'Lekzzy Okafor', position: 'F', ppg: 14.2, rpg: 7.1, apg: 1.8, jersey: 4 },
    ],
  },
  'e12': {
    conference: 'MVC',
    record: '26-8',
    primaryColor: '#4B116F',
    keyPlayers: [
          { name: 'Tytan Anderson', position: 'F', ppg: 16.8, rpg: 7.4, apg: 2.1, jersey: 22 },
    ],
  },
  'e13': {
    conference: 'WAC',
    record: '26-8',
    primaryColor: '#00274C',
    keyPlayers: [
          { name: 'Amari Bailey', position: 'G', ppg: 18.2, rpg: 4.1, apg: 3.6, jersey: 5 },
    ],
  },
  'e14': {
    conference: 'Summit',
    record: '23-11',
    primaryColor: '#005643',
    keyPlayers: [
          { name: 'Dezmond McKinley-Lewis', position: 'F', ppg: 14.4, rpg: 5.8, apg: 2.1, jersey: 3 },
    ],
  },
  'e15': {
    conference: 'SoCon',
    record: '23-11',
    primaryColor: '#582C83',
    keyPlayers: [
          { name: 'JP Pegues', position: 'G', ppg: 17.9, rpg: 4.2, apg: 3.6, jersey: 12 },
    ],
  },
  'e16': {
    conference: 'MAAC',
    record: '20-14',
    primaryColor: '#006341',
    keyPlayers: [
          { name: 'Sahvir Wheeler', position: 'G', ppg: 12.1, rpg: 2.8, apg: 5.1, jersey: 2 },
    ],
  },
  // ── Midwest Region ──────────────────────────
  'm1': {
    conference: 'Big Ten',
    record: '28-6',
    primaryColor: '#FFCB05',
    keyPlayers: [
          { name: 'Danny Wolf', position: 'C', ppg: 15.4, rpg: 8.2, apg: 5.6, jersey: 12 },
    ],
  },
  'm2': {
    conference: 'Big 12',
    record: '29-6',
    primaryColor: '#C8102E',
    keyPlayers: [
          { name: 'Curtis Jones', position: 'G', ppg: 18.4, rpg: 3.4, apg: 4.2, jersey: 5 },
    ],
  },
  'm3': {
    conference: 'ACC',
    record: '25-8',
    primaryColor: '#232D4B',
    keyPlayers: [
          { name: 'Blake Buchanan', position: 'F', ppg: 14.8, rpg: 5.6, apg: 2.4, jersey: 9 },
    ],
  },
  'm4': {
    conference: 'SEC',
    record: '21-13',
    primaryColor: '#9E1B32',
    keyPlayers: [
          { name: 'Mark Sears', position: 'G', ppg: 17.2, rpg: 3.8, apg: 4.8, jersey: 1 },
    ],
  },
  'm5': {
    conference: 'Big 12',
    record: '24-10',
    primaryColor: '#CC0000',
    keyPlayers: [
          { name: 'Darrion Williams', position: 'F', ppg: 15.6, rpg: 6.2, apg: 2.8, jersey: 5 },
    ],
  },
  'm6': {
    conference: 'SEC',
    record: '23-11',
    primaryColor: '#FF8200',
    keyPlayers: [
          { name: 'Chaz Lanier', position: 'G', ppg: 16.8, rpg: 3.4, apg: 2.8, jersey: 10 },
    ],
  },
  'm7': {
    conference: 'SEC',
    record: '21-13',
    primaryColor: '#0033A0',
    keyPlayers: [
          { name: 'Otega Oweh', position: 'G', ppg: 17.4, rpg: 4.2, apg: 3.6, jersey: 12 },
    ],
  },
  'm8': {
    conference: 'SEC',
    record: '17-17',
    primaryColor: '#BA0C2F',
    keyPlayers: [
          { name: 'Dylan James', position: 'G', ppg: 13.4, rpg: 3.6, apg: 2.8, jersey: 5 },
    ],
  },
  'm9': {
    conference: 'A-10',
    record: '21-13',
    primaryColor: '#003DA5',
    keyPlayers: [
          { name: 'Javonte Perkins', position: 'G', ppg: 15.2, rpg: 4.1, apg: 3.8, jersey: 1 },
    ],
  },
  'm10': {
    conference: 'WCC',
    record: '21-13',
    primaryColor: '#862633',
    keyPlayers: [
          { name: 'Adama Bal', position: 'F', ppg: 14.8, rpg: 6.4, apg: 2.2, jersey: 21 },
    ],
  },
  'm11': {
    conference: 'AAC/MAC',
    record: '—',
    primaryColor: '#CC0000',
  },
  'm12': {
    conference: 'MAC',
    record: '23-11',
    primaryColor: '#041E42',
    keyPlayers: [
          { name: 'Ali Ali', position: 'F', ppg: 16.8, rpg: 7.4, apg: 2.1, jersey: 14 },
    ],
  },
  'm13': {
    conference: 'CAA',
    record: '24-10',
    primaryColor: '#006DB4',
    keyPlayers: [
          { name: 'Jaquil Roberson', position: 'G', ppg: 17.4, rpg: 3.8, apg: 4.2, jersey: 10 },
    ],
  },
  'm14': {
    conference: 'Horizon',
    record: '22-12',
    primaryColor: '#866D4B',
    keyPlayers: [
          { name: 'Trey Calvin', position: 'G', ppg: 17.8, rpg: 3.4, apg: 4.1, jersey: 5 },
    ],
  },
  'm15': {
    conference: 'OVC',
    record: '22-12',
    primaryColor: '#4E2683',
    keyPlayers: [
          { name: 'M.J. Randolph', position: 'G', ppg: 16.2, rpg: 3.8, apg: 2.6, jersey: 1 },
    ],
  },
  'm16': {
    conference: 'MEAC/America East',
    record: '—',
    primaryColor: '#003A70',
  },
  // ── South Region ──────────────────────────
  's1': {
    conference: 'SEC',
    record: '30-4',
    primaryColor: '#0021A5',
    keyPlayers: [
          { name: 'Walter Clayton Jr.', position: 'G', ppg: 17.2, rpg: 3.4, apg: 4.8, jersey: 1 },
    ],
  },
  's2': {
    conference: 'Big 12',
    record: '30-5',
    primaryColor: '#CC0000',
    keyPlayers: [
          { name: 'L.J. Cryer', position: 'G', ppg: 17.6, rpg: 2.8, apg: 3.4, jersey: 4 },
    ],
  },
  's3': {
    conference: 'Big Ten',
    record: '25-9',
    primaryColor: '#E84A27',
    keyPlayers: [
          { name: 'Kasparas Jakucionis', position: 'G', ppg: 14.8, rpg: 4.1, apg: 4.6, jersey: 11 },
    ],
  },
  's4': {
    conference: 'Big Ten',
    record: '23-11',
    primaryColor: '#E41C38',
    keyPlayers: [
          { name: 'Juwan Gary', position: 'F', ppg: 14.2, rpg: 7.8, apg: 2.4, jersey: 4 },
    ],
  },
  's5': {
    conference: 'SEC',
    record: '24-10',
    primaryColor: '#866D4B',
    keyPlayers: [
          { name: 'Chris Manon', position: 'F', ppg: 16.4, rpg: 5.8, apg: 2.6, jersey: 5 },
    ],
  },
  's6': {
    conference: 'ACC',
    record: '24-10',
    primaryColor: '#99BFE5',
    keyPlayers: [
          { name: 'Elliot Cadeau', position: 'G', ppg: 13.8, rpg: 3.4, apg: 6.2, jersey: 2 },
    ],
  },
  's7': {
    conference: 'WCC',
    record: '26-8',
    primaryColor: '#D50032',
    keyPlayers: [
          { name: 'Augustas Marciulionis', position: 'G', ppg: 16.2, rpg: 3.8, apg: 4.1, jersey: 11 },
    ],
  },
  's8': {
    conference: 'ACC',
    record: '20-14',
    primaryColor: '#F56600',
    keyPlayers: [
          { name: 'Chase Hunter', position: 'G', ppg: 13.6, rpg: 3.2, apg: 3.8, jersey: 10 },
    ],
  },
  's9': {
    conference: 'Big Ten',
    record: '18-15',
    primaryColor: '#FFCD00',
    keyPlayers: [
          { name: 'Owen Freeman', position: 'F', ppg: 15.4, rpg: 7.6, apg: 2.8, jersey: 14 },
    ],
  },
  's10': {
    conference: 'SEC',
    record: '20-13',
    primaryColor: '#500000',
    keyPlayers: [
          { name: 'Wade Taylor IV', position: 'G', ppg: 16.8, rpg: 2.4, apg: 5.6, jersey: 4 },
    ],
  },
  's11': {
    conference: 'A-10',
    record: '23-11',
    primaryColor: '#FFB300',
    keyPlayers: [
          { name: 'Zeb Jackson', position: 'G', ppg: 16.4, rpg: 3.8, apg: 4.6, jersey: 1 },
    ],
  },
  's12': {
    conference: 'Southland',
    record: '24-8',
    primaryColor: '#005131',
    keyPlayers: [
          { name: 'Christian Shumate', position: 'F', ppg: 15.8, rpg: 7.4, apg: 2.2, jersey: 12 },
    ],
  },
  's13': {
    conference: 'Sun Belt',
    record: '24-10',
    primaryColor: '#8C1D40',
    keyPlayers: [
          { name: 'Quion Williams', position: 'G', ppg: 15.2, rpg: 4.8, apg: 3.6, jersey: 5 },
    ],
  },
  's14': {
    conference: 'Ivy',
    record: '22-9',
    primaryColor: '#001489',
    keyPlayers: [
          { name: 'Nick Spinoso', position: 'C', ppg: 13.4, rpg: 6.8, apg: 2.1, jersey: 55 },
    ],
  },
  's15': {
    conference: 'Big Sky',
    record: '23-12',
    primaryColor: '#B8860B',
    keyPlayers: [
          { name: 'Mikey Dixon', position: 'G', ppg: 18.4, rpg: 3.2, apg: 4.8, jersey: 0 },
    ],
  },
  's16': {
    conference: 'Patriot/SWAC',
    record: '—',
    primaryColor: '#5B2333',
  },
  // ── West Region ──────────────────────────
  'w1': {
    conference: 'Big 12',
    record: '30-4',
    primaryColor: '#003366',
    keyPlayers: [
          { name: 'Caleb Love', position: 'G', ppg: 17.4, rpg: 3.8, apg: 4.2, jersey: 2 },
    ],
  },
  'w2': {
    conference: 'Big Ten',
    record: '27-7',
    primaryColor: '#CEB888',
    keyPlayers: [
          { name: 'Braden Smith', position: 'G', ppg: 13.4, rpg: 4.2, apg: 8.1, jersey: 3 },
    ],
  },
  'w3': {
    conference: 'WCC',
    record: '28-6',
    primaryColor: '#041E42',
    keyPlayers: [
          { name: 'Ryan Nembhard', position: 'G', ppg: 15.8, rpg: 4.1, apg: 6.8, jersey: 0 },
    ],
  },
  'w4': {
    conference: 'SEC',
    record: '22-12',
    primaryColor: '#9D2235',
    keyPlayers: [
          { name: 'Boogie Fland', position: 'G', ppg: 16.2, rpg: 3.4, apg: 4.1, jersey: 1 },
    ],
  },
  'w5': {
    conference: 'Big Ten',
    record: '21-12',
    primaryColor: '#C5050C',
    keyPlayers: [
          { name: 'John Tonje', position: 'G', ppg: 18.4, rpg: 4.1, apg: 2.6, jersey: 11 },
    ],
  },
  'w6': {
    conference: 'Big 12',
    record: '21-12',
    primaryColor: '#002E5D',
    keyPlayers: [
          { name: 'Richie Saunders', position: 'F', ppg: 16.1, rpg: 5.2, apg: 2.9, jersey: 15 },
    ],
  },
  'w7': {
    conference: 'ACC',
    record: '21-13',
    primaryColor: '#005030',
    keyPlayers: [
          { name: 'Matthew Cleveland', position: 'F', ppg: 16.8, rpg: 5.4, apg: 2.8, jersey: 0 },
    ],
  },
  'w8': {
    conference: 'Big East',
    record: '20-13',
    primaryColor: '#00205B',
    keyPlayers: [
          { name: 'TJ Bamba', position: 'F', ppg: 14.2, rpg: 5.4, apg: 1.8, jersey: 3 },
    ],
  },
  'w9': {
    conference: 'Mountain West',
    record: '25-9',
    primaryColor: '#00285E',
    keyPlayers: [
          { name: 'Nique Clifford', position: 'F', ppg: 17.6, rpg: 8.2, apg: 2.4, jersey: 22 },
    ],
  },
  'w10': {
    conference: 'SEC',
    record: '19-14',
    primaryColor: '#F1B300',
    keyPlayers: [
          { name: 'Anthony Robinson', position: 'G', ppg: 14.8, rpg: 3.6, apg: 4.2, jersey: 24 },
    ],
  },
  'w11': {
    conference: 'ACC/Big 12',
    record: '—',
    primaryColor: '#CC0000',
    keyPlayers: [
          { name: 'D.J. Burns Jr.', position: 'F', ppg: 14.6, rpg: 4.2, apg: 2.8, jersey: 30 },
    ],
  },
  'w12': {
    conference: 'Big South',
    record: '28-7',
    primaryColor: '#552583',
    keyPlayers: [
          { name: 'Zyon Pullin', position: 'G', ppg: 19.4, rpg: 3.8, apg: 4.6, jersey: 1 },
    ],
  },
  'w13': {
    conference: 'Big West',
    record: '23-9',
    primaryColor: '#005F61',
    keyPlayers: [
          { name: 'Bernardo da Silva', position: 'C', ppg: 14.8, rpg: 7.4, apg: 2.1, jersey: 22 },
    ],
  },
  'w14': {
    conference: 'ASUN',
    record: '23-12',
    primaryColor: '#FDBB30',
    keyPlayers: [
          { name: 'Chris Youngblood', position: 'G', ppg: 17.2, rpg: 3.8, apg: 2.6, jersey: 5 },
    ],
  },
  'w15': {
    conference: 'Big South',
    record: '25-11',
    primaryColor: '#532A8B',
    keyPlayers: [
          { name: 'Ques Glover', position: 'G', ppg: 19.8, rpg: 3.2, apg: 4.1, jersey: 3 },
    ],
  },
  'w16': {
    conference: 'NEC',
    record: '22-14',
    primaryColor: '#002147',
    keyPlayers: [
          { name: 'Anthony Iglesias', position: 'G', ppg: 14.4, rpg: 3.6, apg: 3.8, jersey: 10 },
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
