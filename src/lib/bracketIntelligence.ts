import type { Game, Bracket, Team } from '@/types/database'
import { ROUND_POINTS } from '@/lib/bracket'

export interface BracketIntelligence {
  // Source badge
  source: 'ESPN' | 'CBS' | 'Yahoo' | 'UFSL'

  // Points: current + max possible
  currentScore: number
  maxPossibleScore: number

  // Rank: current + best possible
  currentRank: number
  poolSize: number
  bestPossibleRank: number
  canWin: boolean
  isEliminated: boolean

  // Champion pick status
  championTeamId: string | null
  championAbbreviation: string | null
  championAlive: boolean | null // null = tournament not started
  championPopularity: number | null // % of pool that picked same champion

  // Next pivotal game
  nextGame: {
    team1Abbr: string
    team2Abbr: string
    scheduledAt: string | null
    isLive: boolean
  } | null

  // Pool size
  memberCount: number
}

const CHAMPIONSHIP_GAME_ID = 'championship-r6-g1'

/**
 * Get the team ID the user picked to win the championship.
 * Falls back to a Final Four pick if no round-6 game exists yet.
 */
function getChampionPick(picks: Record<string, string>, games: Game[]): string | null {
  // Try hardcoded slug first (legacy/imported brackets)
  if (picks[CHAMPIONSHIP_GAME_ID]) return picks[CHAMPIONSHIP_GAME_ID]

  // Try actual round-6 game from DB
  const r6 = games.find(g => g.round === 6)
  if (r6 && picks[r6.id]) return picks[r6.id]

  // Fall back to round-5 picks (Final Four) — pick the one with lower game number
  const r5games = games.filter(g => g.round === 5).sort((a, b) => a.game_number - b.game_number)
  for (const g of r5games) {
    if (picks[g.id]) return picks[g.id]
  }

  return null
}

/**
 * Check if a team is still alive in the tournament.
 * A team is eliminated if they lost a completed game.
 */
function isTeamAlive(teamId: string, games: Game[]): boolean | null {
  const completedGames = games.filter(g => g.status === 'completed' && g.winner_id)
  if (completedGames.length === 0) return null // tournament hasn't started

  for (const game of completedGames) {
    const isInGame = game.team1_id === teamId || game.team2_id === teamId
    if (isInGame && game.winner_id !== teamId) {
      return false // eliminated
    }
  }
  return true
}

/**
 * Derive the pick-slot slug from a DB game record.
 * R1-R4: {region}-r{round}-g{game_number}  (e.g. "east-r1-g3")
 * R5:    ff-r5-g{game_number}
 * R6:    championship-r6-g1
 */
function gameSlug(game: Game): string {
  if (game.round === 6) return 'championship-r6-g1'
  if (game.round === 5) return `ff-r5-g${game.game_number}`
  return `${(game.region || '').toLowerCase()}-r${game.round}-g${game.game_number}`
}

/**
 * Compute max possible score for a bracket.
 * Current score + points for all remaining games where the user's pick could still win.
 */
function computeMaxPossible(
  picks: Record<string, string>,
  games: Game[],
  currentScore: number,
): number {
  let maxAdditional = 0

  for (const game of games) {
    if (game.status === 'completed') continue // already counted in currentScore

    const slug = gameSlug(game)
    const userPick = picks[slug]
    if (!userPick) continue

    // Check if the user's picked team is still alive (not eliminated in a prior game)
    const eliminated = isTeamAlive(userPick, games) === false
    if (eliminated) continue

    // This pick could still score — add the round points
    maxAdditional += ROUND_POINTS[game.round] || 0
  }

  return currentScore + maxAdditional
}

/**
 * Find the next scheduled/in-progress game where the user has a pick.
 */
function findNextPivotalGame(
  picks: Record<string, string>,
  games: Game[],
  teamMap: Map<string, Team>,
): BracketIntelligence['nextGame'] {
  const upcoming = games
    .filter(g => g.status === 'scheduled' || g.status === 'in_progress')
    .filter(g => picks[gameSlug(g)]) // user has a pick on this game
    .sort((a, b) => {
      // Live games first, then by scheduled time
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1
      if (b.status === 'in_progress' && a.status !== 'in_progress') return 1
      const aTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity
      const bTime = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity
      return aTime - bTime
    })

  const next = upcoming[0]
  if (!next) return null

  const t1 = next.team1_id ? teamMap.get(next.team1_id) : null
  const t2 = next.team2_id ? teamMap.get(next.team2_id) : null

  return {
    team1Abbr: t1?.abbreviation || 'TBD',
    team2Abbr: t2?.abbreviation || 'TBD',
    scheduledAt: next.scheduled_at,
    isLive: next.status === 'in_progress',
  }
}

/**
 * Compute bracket intelligence for all of a user's brackets at once.
 */
export function computeAllBracketIntelligence(
  userBrackets: Bracket[],
  allPoolBrackets: Map<string, Bracket[]>, // poolId -> all brackets in that pool
  games: Game[],
  teams: Team[],
  poolMemberCounts: Map<string, number>, // poolId -> member count
): Map<string, BracketIntelligence> {
  const teamMap = new Map(teams.map(t => [t.id, t]))
  const result = new Map<string, BracketIntelligence>()

  for (const bracket of userBrackets) {
    const picks = (bracket.picks || {}) as Record<string, string>
    const poolBrackets = allPoolBrackets.get(bracket.pool_id) || []

    // Source — no source field in DB, default to UFSL
    const source: BracketIntelligence['source'] = 'UFSL'

    // Points
    const currentScore = bracket.score
    const maxPossibleScore = computeMaxPossible(picks, games, currentScore)

    // Rank
    const sortedScores = poolBrackets
      .map(b => b.score)
      .sort((a, b) => b - a)
    const currentRank = sortedScores.findIndex(s => s <= currentScore) + 1
    const poolSize = poolBrackets.length

    // Best possible rank: assume user gets max and compare against others' current scores
    const bestPossibleRank = sortedScores.filter(s => s > maxPossibleScore).length + 1

    // Leader's current score
    const leaderScore = sortedScores[0] || 0
    const canWin = bestPossibleRank === 1
    const isEliminated = maxPossibleScore < leaderScore && poolSize > 1

    // Champion pick
    const championTeamId = getChampionPick(picks, games)
    const championTeam = championTeamId ? teamMap.get(championTeamId) : null
    const championAlive = championTeamId ? isTeamAlive(championTeamId, games) : null

    // Champion popularity — % of pool that picked the same champion
    let championPopularity: number | null = null
    if (championTeamId && poolBrackets.length > 0) {
      const sameChampCount = poolBrackets.filter(b => {
        const bPicks = (b.picks || {}) as Record<string, string>
        return bPicks[CHAMPIONSHIP_GAME_ID] === championTeamId
      }).length
      championPopularity = Math.round((sameChampCount / poolBrackets.length) * 100)
    }

    // Next pivotal game
    const nextGame = findNextPivotalGame(picks, games, teamMap)

    // Pool member count
    const memberCount = poolMemberCounts.get(bracket.pool_id) || poolSize

    result.set(bracket.id, {
      source,
      currentScore,
      maxPossibleScore,
      currentRank: currentRank || 1,
      poolSize,
      bestPossibleRank,
      canWin,
      isEliminated,
      championTeamId,
      championAbbreviation: championTeam?.abbreviation || null,
      championAlive,
      championPopularity,
      nextGame,
      memberCount,
    })
  }

  return result
}
