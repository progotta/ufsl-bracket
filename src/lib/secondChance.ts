// Second Chance Bracket utilities
// Supports mid-tournament bracket entries where users join fresh after each round

import type { BracketGame, BracketTeam } from './bracket'
import type { Game } from '@/types/database'

export type BracketType = 'full' | 'fresh32' | 'sweet16' | 'elite8' | 'final4'

export interface BracketTypeMeta {
  label: string
  shortLabel: string
  teams: number
  picks: number
  startRound: number // first round users make picks for
  accentColor: string
  accentBg: string
  accentBorder: string
  accentText: string
  emoji: string
  tagline: string
  badge: string
  headline: string
  description: string
}

export const BRACKET_TYPE_META: Record<BracketType, BracketTypeMeta> = {
  full: {
    label: 'Full Bracket',
    shortLabel: 'Full',
    teams: 64,
    picks: 63,
    startRound: 1,
    accentColor: '#F97316',
    accentBg: 'bg-brand-orange/10',
    accentBorder: 'border-brand-orange/30',
    accentText: 'text-brand-orange',
    emoji: '🏀',
    tagline: '63 picks — the full ride',
    badge: 'Full Bracket',
    headline: 'The Original',
    description: 'Classic 64-team bracket. Pick every game from tip-off to the championship.',
  },
  fresh32: {
    label: '2nd Chance (Round of 32)',
    shortLabel: '2nd Chance',
    teams: 32,
    picks: 31,
    startRound: 2,
    accentColor: '#3B82F6',
    accentBg: 'bg-blue-500/10',
    accentBorder: 'border-blue-500/30',
    accentText: 'text-blue-400',
    emoji: '🔄',
    tagline: '31 picks — Round 1 is history',
    badge: '2nd Chance',
    headline: 'Bracket Busted? Start Fresh.',
    description: 'Round 1 is done. Start over with the surviving 32 teams. Your bracket died — this one doesn\'t have to.',
  },
  sweet16: {
    label: 'Sweet 16 Bracket',
    shortLabel: 'Sweet 16',
    teams: 16,
    picks: 15,
    startRound: 3,
    accentColor: '#A855F7',
    accentBg: 'bg-purple-500/10',
    accentBorder: 'border-purple-500/30',
    accentText: 'text-purple-400',
    emoji: '🍬',
    tagline: '15 picks — fill out in 2 minutes',
    badge: 'Sweet 16',
    headline: 'Join the Sweet 16. Literally.',
    description: '16 elite teams, 15 picks. Pure chaos, zero commitment. Who survives from here?',
  },
  elite8: {
    label: 'Elite 8 Bracket',
    shortLabel: 'Elite 8',
    teams: 8,
    picks: 7,
    startRound: 4,
    accentColor: '#EF4444',
    accentBg: 'bg-red-500/10',
    accentBorder: 'border-red-500/30',
    accentText: 'text-red-400',
    emoji: '🔥',
    tagline: '7 picks — only the elite remain',
    badge: 'Elite 8',
    headline: 'It\'s Never Too Late to Win',
    description: '8 teams. 7 games. One champion. Jump in now and still have a shot at glory.',
  },
  final4: {
    label: 'Final Four Bracket',
    shortLabel: 'Final Four',
    teams: 4,
    picks: 3,
    startRound: 5,
    accentColor: '#EAB308',
    accentBg: 'bg-yellow-500/10',
    accentBorder: 'border-yellow-500/30',
    accentText: 'text-yellow-400',
    emoji: '👑',
    tagline: '3 picks — pick a champion',
    badge: 'Final Four',
    headline: 'One Last Shot',
    description: 'The Final Four is set. Three picks stand between you and calling it. Who lifts the trophy?',
  },
}

export const BRACKET_TYPE_ORDER: BracketType[] = ['full', 'fresh32', 'sweet16', 'elite8', 'final4']

/**
 * Get rounds that belong to a bracket type
 */
export function getRoundsForBracketType(type: BracketType): number[] {
  const meta = BRACKET_TYPE_META[type]
  const rounds: number[] = []
  for (let r = meta.startRound; r <= 6; r++) {
    rounds.push(r)
  }
  return rounds
}

/**
 * Filter bracket games to only those relevant for this bracket type
 * (i.e., rounds >= startRound)
 */
export function getGamesForBracketType(
  type: BracketType,
  games: BracketGame[]
): BracketGame[] {
  const meta = BRACKET_TYPE_META[type]
  return games.filter(g => g.round >= meta.startRound)
}

/**
 * Get teams that are still alive at the start of a bracket type's round.
 * For 'full', returns all teams.
 * For others, returns winners of the previous round from actual game results.
 *
 * @param type - bracket type
 * @param games - actual DB games with winner_id set
 * @param allTeams - all teams in the tournament
 */
export function getTeamsForBracketType(
  type: BracketType,
  games: Game[],
  allTeams: BracketGame['team1'][]
): BracketGame['team1'][] {
  if (type === 'full') return allTeams

  const meta = BRACKET_TYPE_META[type]
  const previousRound = meta.startRound - 1

  // Collect winners from the previous round
  const previousRoundGames = games.filter(g => g.round === previousRound)
  const aliveTeamIds = new Set(
    previousRoundGames
      .map(g => g.winner_id)
      .filter((id): id is string => id !== null)
  )

  return allTeams.filter(t => t && aliveTeamIds.has(t.id))
}

/**
 * Check if a bracket type is still open for new entries.
 * A bracket type is open if the round BEFORE its startRound isn't fully completed yet.
 * 'full' is open until round 1 starts.
 * 'fresh32' is open after round 1 completes but before round 2 starts.
 *
 * Uses actual game data to determine tournament progress.
 */
export function isBracketTypeOpen(type: BracketType, games: Game[]): boolean {
  const meta = BRACKET_TYPE_META[type]

  if (type === 'full') {
    // Full bracket is open until round 1 has any completed or in-progress games
    const round1Games = games.filter(g => g.round === 1)
    return round1Games.every(g => g.status === 'scheduled')
  }

  const previousRound = meta.startRound - 1
  const currentRound = meta.startRound

  const prevRoundGames = games.filter(g => g.round === previousRound)
  const currRoundGames = games.filter(g => g.round === currentRound)

  // Previous round must be fully completed
  const prevDone = prevRoundGames.length > 0 &&
    prevRoundGames.every(g => g.status === 'completed')

  // Current round must not have started yet
  const currNotStarted = currRoundGames.every(g => g.status === 'scheduled')

  return prevDone && currNotStarted
}

/**
 * Get the currently open bracket types based on tournament progress
 */
export function getOpenBracketTypes(games: Game[]): BracketType[] {
  return BRACKET_TYPE_ORDER.filter(type => isBracketTypeOpen(type, games))
}

/**
 * Get the most recently completed round number (based on game data)
 */
export function getCurrentRound(games: Game[]): number {
  const completedGames = games.filter(g => g.status === 'completed')
  if (completedGames.length === 0) return 0
  return Math.max(...completedGames.map(g => g.round))
}

/**
 * Check if a user's bracket is "busted" (has no remaining possible correct picks)
 * A bracket is busted if at least one eliminated team was picked to win a future game.
 */
export function isBracketBusted(
  picks: Record<string, string>,
  games: Game[]
): boolean {
  // Get all teams that have been eliminated (lost a completed game)
  const eliminatedTeams = new Set<string>()
  for (const game of games) {
    if (game.status === 'completed' && game.winner_id) {
      if (game.team1_id && game.team1_id !== game.winner_id) {
        eliminatedTeams.add(game.team1_id)
      }
      if (game.team2_id && game.team2_id !== game.winner_id) {
        eliminatedTeams.add(game.team2_id)
      }
    }
  }

  // Check if any pick involves an eliminated team for a future (not yet completed) game
  const completedGameIds = new Set(
    games.filter(g => g.status === 'completed').map(g => g.id)
  )

  for (const [gameId, pickedTeamId] of Object.entries(picks)) {
    if (!completedGameIds.has(gameId) && eliminatedTeams.has(pickedTeamId)) {
      return true
    }
  }

  return false
}

/**
 * Get the label for a pool based on bracket_type
 */
export function getPoolBracketLabel(type: BracketType): string {
  return BRACKET_TYPE_META[type].label + ' Pool'
}
