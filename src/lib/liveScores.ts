// Live scores types and ESPN API utilities

export interface LiveGameScore {
  /** Internal game ID (matches our DB game.id, if resolvable) */
  id: string
  /** ESPN event ID */
  espnId?: string
  /** Canonical game status */
  status: 'scheduled' | 'in_progress' | 'halftime' | 'completed'
  /** Human-readable clock/period string, e.g. "2nd Half 12:34" or "Final" */
  clock: string
  /** Period number (1 or 2 for basketball halves) */
  period: number

  team1: LiveTeamScore
  team2: LiveTeamScore

  /** True when score difference ≤ 5 with < 2 min left */
  isClose: boolean
  /** Game start time ISO string */
  scheduledAt?: string
  /** When the game data was last fetched */
  fetchedAt: string
}

export interface LiveTeamScore {
  /** Internal team ID from our DB (if matched) */
  id?: string
  /** ESPN team ID (for logo CDN) */
  espnTeamId?: string
  name: string
  abbreviation: string
  seed?: number
  score: number
  /** True if this team is currently winning */
  isWinning: boolean
}

export interface LiveScoresResponse {
  games: LiveGameScore[]
  source: 'espn' | 'simulation' | 'database'
  cachedUntil: string
  fetchedAt: string
}

// ESPN Scoreboard API for Men's NCAA Basketball (groups=50 = Tournament)
const ESPN_SCOREBOARD_URL =
  'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?groups=50&limit=64'

// Simple in-memory cache (per-process)
let cachedResponse: LiveScoresResponse | null = null
let cacheExpiresAt = 0

export function isCacheValid(): boolean {
  return cachedResponse !== null && Date.now() < cacheExpiresAt
}

export function getCache(): LiveScoresResponse | null {
  return cachedResponse
}

export function setCache(data: LiveScoresResponse, ttlMs = 30_000): void {
  cachedResponse = data
  cacheExpiresAt = Date.now() + ttlMs
}

/**
 * Parse ESPN scoreboard API response into our LiveGameScore format.
 * Returns empty array if response is invalid.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseEspnScoreboard(json: any): LiveGameScore[] {
  const events = json?.events
  if (!Array.isArray(events)) return []

  const results: LiveGameScore[] = []
  const now = new Date().toISOString()

  for (const event of events) {
    try {
      const comp = event?.competitions?.[0]
      if (!comp) continue

      const competitors: LiveTeamScore[] = []
      for (const c of comp.competitors ?? []) {
        competitors.push({
          name: c.team?.displayName ?? c.team?.name ?? 'TBD',
          abbreviation: c.team?.abbreviation ?? '???',
          espnTeamId: c.team?.id ? String(c.team.id) : undefined,
          seed: (() => {
            // ESPN curatedRank is AP poll ranking (99 = unranked), not tournament seed.
            // Prefer the actual tournament seed from linescores/notes, fall back to
            // curatedRank only if it's a valid tournament seed (1-16).
            const rank = c.curatedRank?.current
            return rank && rank >= 1 && rank <= 16 ? rank : undefined
          })(),
          score: parseInt(c.score ?? '0', 10),
          isWinning: c.winner === true, // finalized below after both scores known
        })
      }

      if (competitors.length < 2) continue

      // Sort: home team (homeAway === 'home') first as team1, else keep original order
      const [team1, team2] = competitors[0]?.abbreviation ? competitors : [competitors[1], competitors[0]]

      // Fix isWinning: ESPN only sets c.winner on final result, not during live games.
      // Compare scores directly so live games show correct winning/losing state.
      if (team1 && team2) {
        if (team1.score !== team2.score) {
          team1.isWinning = team1.score > team2.score
          team2.isWinning = team2.score > team1.score
        } else {
          // Tied — neither is winning
          team1.isWinning = false
          team2.isWinning = false
        }
      }

      const statusName: string = event.status?.type?.name ?? ''
      const statusDesc: string = event.status?.type?.description ?? ''
      const period: number = event.status?.period ?? 1
      const displayClock: string = event.status?.displayClock ?? ''

      let status: LiveGameScore['status'] = 'scheduled'
      let clock = ''

      if (statusName === 'STATUS_IN_PROGRESS') {
        status = 'in_progress'
        // Basketball halves
        const half = period === 1 ? '1st Half' : period === 2 ? '2nd Half' : `OT${period - 2}`
        clock = displayClock ? `${half} ${displayClock}` : half
      } else if (statusName === 'STATUS_HALFTIME') {
        status = 'halftime'
        clock = 'Halftime'
      } else if (statusName === 'STATUS_FINAL' || statusDesc === 'Final') {
        status = 'completed'
        clock = 'Final'
      } else if (statusName === 'STATUS_SCHEDULED') {
        status = 'scheduled'
        const tip = event.date ? new Date(event.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }) : 'TBD'
        clock = tip
      } else {
        status = 'in_progress'
        clock = statusDesc || 'In Progress'
      }

      // Detect close games: within 5 points, last 2 minutes of 2nd half
      const scoreDiff = Math.abs((team1?.score ?? 0) - (team2?.score ?? 0))
      const isLastMinutes = period >= 2 && displayClock && parseClockSeconds(displayClock) <= 120
      const isClose = status === 'in_progress' && scoreDiff <= 5 && (isLastMinutes || false)

      results.push({
        id: event.id ?? '',
        espnId: event.id,
        status,
        clock,
        period,
        team1: team1 ?? { name: 'TBD', abbreviation: 'TBD', score: 0, isWinning: false },
        team2: team2 ?? { name: 'TBD', abbreviation: 'TBD', score: 0, isWinning: false },
        isClose,
        scheduledAt: event.date,
        fetchedAt: now,
      })
    } catch {
      // Skip malformed events
    }
  }

  return results
}

function parseClockSeconds(clock: string): number {
  // Parses "12:34" → 754 seconds
  const parts = clock.split(':')
  if (parts.length === 2) {
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
  }
  return 999
}

/**
 * Build LiveGameScore entries from our DB games (simulation/test mode).
 */
export function buildSimulationScores(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  games: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamsMap: Map<string, any>
): LiveGameScore[] {
  const now = new Date().toISOString()
  return games
    .filter(g => g.status === 'in_progress' || g.status === 'completed')
    .map(g => {
      const team1 = g.team1_id ? teamsMap.get(g.team1_id) : null
      const team2 = g.team2_id ? teamsMap.get(g.team2_id) : null
      const score1 = g.team1_score ?? 0
      const score2 = g.team2_score ?? 0

      return {
        id: g.id,
        status: g.status === 'completed' ? 'completed' : 'in_progress',
        clock: g.status === 'completed' ? 'Final' : '2nd Half',
        period: 2,
        team1: {
          id: g.team1_id ?? undefined,
          name: team1?.name ?? 'TBD',
          abbreviation: team1?.abbreviation ?? 'TBD',
          seed: team1?.seed ?? undefined,
          score: score1,
          isWinning: score1 > score2,
        },
        team2: {
          id: g.team2_id ?? undefined,
          name: team2?.name ?? 'TBD',
          abbreviation: team2?.abbreviation ?? 'TBD',
          seed: team2?.seed ?? undefined,
          score: score2,
          isWinning: score2 > score1,
        },
        isClose: Math.abs(score1 - score2) <= 5,
        scheduledAt: g.scheduled_at ?? undefined,
        fetchedAt: now,
      }
    })
}

/**
 * Event classification for notification hooks.
 */
export type ScoreEvent =
  | { type: 'your_pick_losing'; gameId: string; teamName: string; margin: number }
  | { type: 'upset_alert'; gameId: string; higherSeed: string; lowerSeed: string; margin: number }
  | { type: 'close_game'; gameId: string; team1: string; team2: string; scoreDiff: number }

/**
 * Analyze live games for notification-worthy events.
 * @param games Current live games
 * @param userPickIds Set of team IDs the user has picked to win (in any upcoming game)
 */
export function detectScoreEvents(
  games: LiveGameScore[],
  userPickIds: Set<string>
): ScoreEvent[] {
  const events: ScoreEvent[] = []

  for (const game of games) {
    if (game.status !== 'in_progress') continue

    // Close game alert
    if (game.isClose) {
      events.push({
        type: 'close_game',
        gameId: game.id,
        team1: game.team1.name,
        team2: game.team2.name,
        scoreDiff: Math.abs(game.team1.score - game.team2.score),
      })
    }

    // Your pick is losing
    for (const team of [game.team1, game.team2]) {
      if (team.id && userPickIds.has(team.id) && !team.isWinning) {
        const opponent = team === game.team1 ? game.team2 : game.team1
        events.push({
          type: 'your_pick_losing',
          gameId: game.id,
          teamName: team.name,
          margin: Math.abs(team.score - opponent.score),
        })
      }
    }

    // Upset alert: lower seed (worse team, higher number) is winning over higher seed
    const s1 = game.team1.seed
    const s2 = game.team2.seed
    if (s1 && s2) {
      const favoriteWinning = s1 < s2 ? game.team1.isWinning : game.team2.isWinning
      const underdog = s1 > s2 ? game.team1 : game.team2
      const favorite = s1 < s2 ? game.team1 : game.team2
      const seedDiff = Math.abs(s1 - s2)
      if (!favoriteWinning && seedDiff >= 4) {
        events.push({
          type: 'upset_alert',
          gameId: game.id,
          higherSeed: underdog.name,
          lowerSeed: favorite.name,
          margin: Math.abs(game.team1.score - game.team2.score),
        })
      }
    }
  }

  return events
}
