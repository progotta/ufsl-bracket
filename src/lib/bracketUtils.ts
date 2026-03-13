import type { Game } from '@/types/database'

export interface RoundBreakdown {
  round: number
  label: string
  correct: number
  total: number
  started: boolean
}

const ROUND_LABELS: Record<number, string> = {
  1: 'R1',
  2: 'R2',
  3: 'R3',
  4: 'E8',
  5: 'F4',
  6: 'NCG',
}

const ROUND_TOTALS: Record<number, number> = {
  1: 32,
  2: 16,
  3: 8,
  4: 4,
  5: 2,
  6: 1,
}

/**
 * Compute per-round breakdown of correct picks for a bracket.
 */
export function computeRoundBreakdown(
  picks: Record<string, string>,
  games: Game[],
): RoundBreakdown[] {
  const breakdown: RoundBreakdown[] = []

  for (let round = 1; round <= 6; round++) {
    const roundGames = games.filter(g => g.round === round)
    const completedGames = roundGames.filter(g => g.status === 'completed' && g.winner_id)
    const started = roundGames.some(g => g.status !== 'scheduled')

    let correct = 0
    for (const game of completedGames) {
      if (picks[game.id] === game.winner_id) {
        correct++
      }
    }

    breakdown.push({
      round,
      label: ROUND_LABELS[round],
      correct,
      total: ROUND_TOTALS[round],
      started,
    })
  }

  return breakdown
}

export type Badge = {
  emoji: string
  label: string
}

/**
 * Compute achievement badges for a bracket based on round breakdowns.
 */
export function computeBadges(
  breakdown: RoundBreakdown[],
  isLeading: boolean,
): Badge[] {
  const badges: Badge[] = []

  for (const rd of breakdown) {
    if (!rd.started) continue
    const completedAll = rd.correct + (rd.total - rd.correct) >= rd.total // all games decided
    // Check if all games in this round are completed
    const allDecided = rd.started && (rd.correct <= rd.total)

    if (rd.correct === rd.total && rd.total > 0 && completedAll) {
      badges.push({ emoji: '🎯', label: `Perfect ${rd.label}` })
    } else if (rd.total > 0 && rd.correct / rd.total > 0.75) {
      badges.push({ emoji: '🔥', label: `${rd.label} On Fire` })
    } else if (rd.correct === 0 && rd.started && allDecided) {
      // Only show busted if the round actually has completed games
      // We need to check more carefully — "busted" means 0 correct in a fully completed round
      // We'll handle this in the component where we have full game data
    }
  }

  if (isLeading) {
    badges.push({ emoji: '👑', label: 'Leading' })
  }

  return badges
}

/**
 * Compute achievement badges with access to full game data for accurate "busted" detection.
 */
export function computeBadgesFromGames(
  picks: Record<string, string>,
  games: Game[],
  isLeading: boolean,
): Badge[] {
  const badges: Badge[] = []

  for (let round = 1; round <= 6; round++) {
    const roundGames = games.filter(g => g.round === round)
    const completedGames = roundGames.filter(g => g.status === 'completed' && g.winner_id)
    const allCompleted = roundGames.length > 0 && roundGames.every(g => g.status === 'completed')
    const started = roundGames.some(g => g.status !== 'scheduled')

    if (!started || completedGames.length === 0) continue

    let correct = 0
    for (const game of completedGames) {
      if (picks[game.id] === game.winner_id) {
        correct++
      }
    }

    const total = ROUND_TOTALS[round]
    const label = ROUND_LABELS[round]

    if (allCompleted && correct === total && total > 0) {
      badges.push({ emoji: '🎯', label: `Perfect ${label}` })
    } else if (correct / total > 0.75) {
      badges.push({ emoji: '🔥', label: `${label} On Fire` })
    } else if (allCompleted && correct === 0) {
      badges.push({ emoji: '💀', label: `${label} Busted` })
    }
  }

  if (isLeading) {
    badges.push({ emoji: '👑', label: 'Leading' })
  }

  return badges
}
