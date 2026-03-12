// Quick-fill strategies for bracket picking

import { resolveBracket, type BracketGame, type BracketTeam } from './bracket'

export type FillStrategy = 'chalk' | 'reverse-chalk' | 'random' | 'chaos'

export const FILL_STRATEGY_META: Record<FillStrategy, { label: string; description: string; emoji: string }> = {
  chalk: {
    label: 'Chalk',
    description: 'Pick all favorites (better seeds win every game)',
    emoji: '🏆',
  },
  'reverse-chalk': {
    label: 'Reverse Chalk',
    description: 'Pick all underdogs (worse seeds win every game)',
    emoji: '💥',
  },
  random: {
    label: 'Random',
    description: 'Seed-weighted random (1-seeds favored, 16-seeds longshots)',
    emoji: '🎲',
  },
  chaos: {
    label: 'Chaos',
    description: 'Pure coin flip — 50/50 every game',
    emoji: '🌀',
  },
}

/**
 * Generate a full set of picks using a quick-fill strategy.
 * Processes rounds 1–6 in order, resolving the bracket after each round
 * so later games reflect which teams actually advanced.
 */
export function generateQuickFillPicks(
  baseGames: BracketGame[],
  teams: BracketTeam[],
  strategy: FillStrategy
): Record<string, string> {
  const newPicks: Record<string, string> = {}

  for (let round = 1; round <= 6; round++) {
    // Resolve bracket with picks accumulated so far
    const resolvedGames = resolveBracket(baseGames, newPicks, teams)

    const roundGames = resolvedGames
      .filter(g => g.round === round)
      .sort((a, b) => a.gameNumber - b.gameNumber)

    for (const game of roundGames) {
      if (!game.team1 || !game.team2) continue
      if (
        game.team1.id.startsWith('placeholder') ||
        game.team2.id.startsWith('placeholder')
      )
        continue

      newPicks[game.id] = pickWinner(game.team1, game.team2, strategy)
    }
  }

  return newPicks
}

function pickWinner(
  team1: BracketTeam,
  team2: BracketTeam,
  strategy: FillStrategy
): string {
  switch (strategy) {
    case 'chalk':
      // Lower seed number = better team
      return team1.seed <= team2.seed ? team1.id : team2.id

    case 'reverse-chalk':
      // Higher seed number = bigger underdog
      return team1.seed >= team2.seed ? team1.id : team2.id

    case 'random': {
      // Weight by (17 - seed): 1-seed has 16 pts, 16-seed has 1 pt
      const w1 = 17 - team1.seed
      const w2 = 17 - team2.seed
      return Math.random() * (w1 + w2) < w1 ? team1.id : team2.id
    }

    case 'chaos':
      // Pure 50/50
      return Math.random() < 0.5 ? team1.id : team2.id

    default:
      return team1.id
  }
}

/**
 * Count how many picks would change with a new fill (for preview).
 */
export function countPickChanges(
  currentPicks: Record<string, string>,
  newPicks: Record<string, string>
): { changed: number; total: number } {
  const allKeys = Array.from(new Set([...Object.keys(currentPicks), ...Object.keys(newPicks)]))
  let changed = 0
  for (const key of allKeys) {
    if (currentPicks[key] !== newPicks[key]) changed++
  }
  return { changed, total: Object.keys(newPicks).length }
}
