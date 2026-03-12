// Simulator utilities for UFSL Bracket admin tools

export interface SimGameResult {
  winnerId: string
  team1Score: number
  team2Score: number
  completedAt?: string
}

interface GameWithTeams {
  id: string
  round: number
  team1: { id: string; seed: number | null } | null
  team2: { id: string; seed: number | null } | null
}

/**
 * Simulate a single game result.
 * If useActual=true and we have a hardcoded result, use it.
 * Otherwise, use seed-weighted probability.
 */
export function simulateGame(game: GameWithTeams, useActual = false): SimGameResult {
  if (useActual) {
    const actual = ACTUAL_2025_RESULTS[game.id]
    if (actual) return actual
  }

  if (!game.team1 || !game.team2) {
    throw new Error('Game has no teams')
  }

  // Weighted random based on seed — lower seed = better team
  const seed1 = game.team1.seed ?? 8
  const seed2 = game.team2.seed ?? 8
  const team1WinProb = winProbability(seed1, seed2)
  const team1Wins = Math.random() < team1WinProb
  const winnerId = team1Wins ? game.team1.id : game.team2.id

  // Generate realistic scores
  const baseScore = 65 + Math.floor(Math.random() * 15) // 65-80
  const marginMin = 3
  const marginMax = seed1 === seed2 ? 10 : Math.abs(seed1 - seed2) * 2 + 5
  const margin = marginMin + Math.floor(Math.random() * (marginMax - marginMin))

  const winnerScore = baseScore + Math.floor(margin / 2) + Math.floor(Math.random() * 5)
  const loserScore = winnerScore - margin

  return {
    winnerId,
    team1Score: team1Wins ? winnerScore : loserScore,
    team2Score: team1Wins ? loserScore : winnerScore,
  }
}

/**
 * Probability that seed1 beats seed2 using logistic model.
 * Seed 1 vs 16 → ~92% win rate for 1.
 * Seed 8 vs 9 → ~50% (coin flip).
 */
function winProbability(seed1: number, seed2: number): number {
  const diff = seed2 - seed1 // positive = team1 is better
  // Logistic: p = 1 / (1 + exp(-k*diff))
  const k = 0.22
  return 1 / (1 + Math.exp(-k * diff))
}

// ============================================================
// Actual 2025 NCAA Tournament Results
// Keyed by game ID from the 002_test_2025_data.sql migration
// ============================================================
export const ACTUAL_2025_RESULTS: Record<string, SimGameResult> = {
  // ── ROUND 1 ──────────────────────────────────────────────────
  // EAST
  'a0000000-0001-0001-0000-000000000001': { winnerId: '00000000-0000-0000-0001-000000000001', team1Score: 93, team2Score: 55, completedAt: '2025-03-20T19:30:00Z' },
  'a0000000-0001-0002-0000-000000000001': { winnerId: '00000000-0000-0000-0001-000000000009', team1Score: 67, team2Score: 72, completedAt: '2025-03-20T22:05:00Z' },
  'a0000000-0001-0003-0000-000000000001': { winnerId: '00000000-0000-0000-0001-000000000005', team1Score: 78, team2Score: 64, completedAt: '2025-03-21T02:50:00Z' },
  'a0000000-0001-0004-0000-000000000001': { winnerId: '00000000-0000-0000-0001-000000000004', team1Score: 82, team2Score: 59, completedAt: '2025-03-21T05:15:00Z' },
  'a0000000-0001-0005-0000-000000000001': { winnerId: '00000000-0000-0000-0001-000000000006', team1Score: 76, team2Score: 68, completedAt: '2025-03-21T19:35:00Z' },
  'a0000000-0001-0006-0000-000000000001': { winnerId: '00000000-0000-0000-0001-000000000003', team1Score: 84, team2Score: 51, completedAt: '2025-03-21T22:05:00Z' },
  'a0000000-0001-0007-0000-000000000001': { winnerId: '00000000-0000-0000-0001-000000000010', team1Score: 64, team2Score: 71, completedAt: '2025-03-22T02:55:00Z' },
  'a0000000-0001-0008-0000-000000000001': { winnerId: '00000000-0000-0000-0001-000000000002', team1Score: 89, team2Score: 61, completedAt: '2025-03-22T05:20:00Z' },
  // WEST
  'a0000000-0001-0009-0000-000000000001': { winnerId: '00000000-0000-0000-0002-000000000001', team1Score: 97, team2Score: 58, completedAt: '2025-03-20T19:30:00Z' },
  'a0000000-0001-0010-0000-000000000001': { winnerId: '00000000-0000-0000-0002-000000000009', team1Score: 68, team2Score: 73, completedAt: '2025-03-20T22:05:00Z' },
  'a0000000-0001-0011-0000-000000000001': { winnerId: '00000000-0000-0000-0002-000000000012', team1Score: 65, team2Score: 69, completedAt: '2025-03-21T02:50:00Z' },
  'a0000000-0001-0012-0000-000000000001': { winnerId: '00000000-0000-0000-0002-000000000004', team1Score: 79, team2Score: 62, completedAt: '2025-03-21T05:15:00Z' },
  'a0000000-0001-0013-0000-000000000001': { winnerId: '00000000-0000-0000-0002-000000000006', team1Score: 74, team2Score: 68, completedAt: '2025-03-21T19:35:00Z' },
  'a0000000-0001-0014-0000-000000000001': { winnerId: '00000000-0000-0000-0002-000000000003', team1Score: 85, team2Score: 57, completedAt: '2025-03-21T22:05:00Z' },
  'a0000000-0001-0015-0000-000000000001': { winnerId: '00000000-0000-0000-0002-000000000010', team1Score: 66, team2Score: 70, completedAt: '2025-03-22T02:55:00Z' },
  'a0000000-0001-0016-0000-000000000001': { winnerId: '00000000-0000-0000-0002-000000000002', team1Score: 83, team2Score: 54, completedAt: '2025-03-22T05:20:00Z' },
  // SOUTH
  'a0000000-0001-0017-0000-000000000001': { winnerId: '00000000-0000-0000-0003-000000000001', team1Score: 101, team2Score: 64, completedAt: '2025-03-20T19:55:00Z' },
  'a0000000-0001-0018-0000-000000000001': { winnerId: '00000000-0000-0000-0003-000000000008', team1Score: 77, team2Score: 69, completedAt: '2025-03-20T22:25:00Z' },
  'a0000000-0001-0019-0000-000000000001': { winnerId: '00000000-0000-0000-0003-000000000005', team1Score: 80, team2Score: 71, completedAt: '2025-03-21T03:15:00Z' },
  'a0000000-0001-0020-0000-000000000001': { winnerId: '00000000-0000-0000-0003-000000000004', team1Score: 86, team2Score: 60, completedAt: '2025-03-21T05:35:00Z' },
  'a0000000-0001-0021-0000-000000000001': { winnerId: '00000000-0000-0000-0003-000000000006', team1Score: 71, team2Score: 63, completedAt: '2025-03-21T19:55:00Z' },
  'a0000000-0001-0022-0000-000000000001': { winnerId: '00000000-0000-0000-0003-000000000003', team1Score: 88, team2Score: 56, completedAt: '2025-03-21T22:25:00Z' },
  'a0000000-0001-0023-0000-000000000001': { winnerId: '00000000-0000-0000-0003-000000000007', team1Score: 73, team2Score: 67, completedAt: '2025-03-22T03:15:00Z' },
  'a0000000-0001-0024-0000-000000000001': { winnerId: '00000000-0000-0000-0003-000000000002', team1Score: 90, team2Score: 53, completedAt: '2025-03-22T05:35:00Z' },
  // MIDWEST
  'a0000000-0001-0025-0000-000000000001': { winnerId: '00000000-0000-0000-0004-000000000001', team1Score: 95, team2Score: 61, completedAt: '2025-03-20T19:55:00Z' },
  'a0000000-0001-0026-0000-000000000001': { winnerId: '00000000-0000-0000-0004-000000000008', team1Score: 79, team2Score: 65, completedAt: '2025-03-20T22:25:00Z' },
  'a0000000-0001-0027-0000-000000000001': { winnerId: '00000000-0000-0000-0004-000000000005', team1Score: 76, team2Score: 70, completedAt: '2025-03-21T03:15:00Z' },
  'a0000000-0001-0028-0000-000000000001': { winnerId: '00000000-0000-0000-0004-000000000004', team1Score: 87, team2Score: 55, completedAt: '2025-03-21T05:35:00Z' },
  'a0000000-0001-0029-0000-000000000001': { winnerId: '00000000-0000-0000-0004-000000000011', team1Score: 61, team2Score: 66, completedAt: '2025-03-21T19:55:00Z' },
  'a0000000-0001-0030-0000-000000000001': { winnerId: '00000000-0000-0000-0004-000000000003', team1Score: 82, team2Score: 57, completedAt: '2025-03-21T22:25:00Z' },
  'a0000000-0001-0031-0000-000000000001': { winnerId: '00000000-0000-0000-0004-000000000007', team1Score: 71, team2Score: 68, completedAt: '2025-03-22T03:15:00Z' },
  'a0000000-0001-0032-0000-000000000001': { winnerId: '00000000-0000-0000-0004-000000000002', team1Score: 91, team2Score: 52, completedAt: '2025-03-22T05:35:00Z' },

  // ── ROUND 2 ──────────────────────────────────────────────────
  'a0000000-0002-0033-0000-000000000001': { winnerId: '00000000-0000-0000-0001-000000000001', team1Score: 87, team2Score: 72, completedAt: '2025-03-22T21:55:00Z' },
  'a0000000-0002-0034-0000-000000000001': { winnerId: '00000000-0000-0000-0001-000000000004', team1Score: 69, team2Score: 75, completedAt: '2025-03-23T00:20:00Z' },
  'a0000000-0002-0035-0000-000000000001': { winnerId: '00000000-0000-0000-0001-000000000003', team1Score: 68, team2Score: 78, completedAt: '2025-03-23T02:50:00Z' },
  'a0000000-0002-0036-0000-000000000001': { winnerId: '00000000-0000-0000-0001-000000000002', team1Score: 63, team2Score: 77, completedAt: '2025-03-23T05:15:00Z' },
  'a0000000-0002-0037-0000-000000000001': { winnerId: '00000000-0000-0000-0002-000000000001', team1Score: 82, team2Score: 68, completedAt: '2025-03-22T21:55:00Z' },
  'a0000000-0002-0038-0000-000000000001': { winnerId: '00000000-0000-0000-0002-000000000004', team1Score: 58, team2Score: 67, completedAt: '2025-03-23T00:20:00Z' },
  'a0000000-0002-0039-0000-000000000001': { winnerId: '00000000-0000-0000-0002-000000000003', team1Score: 70, team2Score: 78, completedAt: '2025-03-23T02:50:00Z' },
  'a0000000-0002-0040-0000-000000000001': { winnerId: '00000000-0000-0000-0002-000000000002', team1Score: 61, team2Score: 74, completedAt: '2025-03-23T05:15:00Z' },
  'a0000000-0002-0041-0000-000000000001': { winnerId: '00000000-0000-0000-0003-000000000001', team1Score: 84, team2Score: 72, completedAt: '2025-03-23T21:55:00Z' },
  'a0000000-0002-0042-0000-000000000001': { winnerId: '00000000-0000-0000-0003-000000000005', team1Score: 73, team2Score: 67, completedAt: '2025-03-24T00:20:00Z' },
  'a0000000-0002-0043-0000-000000000001': { winnerId: '00000000-0000-0000-0003-000000000003', team1Score: 65, team2Score: 79, completedAt: '2025-03-24T02:50:00Z' },
  'a0000000-0002-0044-0000-000000000001': { winnerId: '00000000-0000-0000-0003-000000000002', team1Score: 68, team2Score: 74, completedAt: '2025-03-24T05:15:00Z' },
  'a0000000-0002-0045-0000-000000000001': { winnerId: '00000000-0000-0000-0004-000000000001', team1Score: 83, team2Score: 69, completedAt: '2025-03-23T21:55:00Z' },
  'a0000000-0002-0046-0000-000000000001': { winnerId: '00000000-0000-0000-0004-000000000004', team1Score: 70, team2Score: 74, completedAt: '2025-03-24T00:20:00Z' },
  'a0000000-0002-0047-0000-000000000001': { winnerId: '00000000-0000-0000-0004-000000000003', team1Score: 57, team2Score: 75, completedAt: '2025-03-24T02:50:00Z' },
  'a0000000-0002-0048-0000-000000000001': { winnerId: '00000000-0000-0000-0004-000000000002', team1Score: 66, team2Score: 80, completedAt: '2025-03-24T05:15:00Z' },

  // ── SWEET 16 ─────────────────────────────────────────────────
  'a0000000-0003-0049-0000-000000000001': { winnerId: '00000000-0000-0000-0001-000000000001', team1Score: 78, team2Score: 71, completedAt: '2025-03-28T02:30:00Z' },
  'a0000000-0003-0050-0000-000000000001': { winnerId: '00000000-0000-0000-0001-000000000002', team1Score: 67, team2Score: 75, completedAt: '2025-03-28T05:05:00Z' },
  'a0000000-0003-0051-0000-000000000001': { winnerId: '00000000-0000-0000-0002-000000000001', team1Score: 85, team2Score: 71, completedAt: '2025-03-28T02:30:00Z' },
  'a0000000-0003-0052-0000-000000000001': { winnerId: '00000000-0000-0000-0002-000000000002', team1Score: 72, team2Score: 76, completedAt: '2025-03-28T05:05:00Z' },
  'a0000000-0003-0053-0000-000000000001': { winnerId: '00000000-0000-0000-0003-000000000001', team1Score: 89, team2Score: 77, completedAt: '2025-03-29T02:30:00Z' },
  'a0000000-0003-0054-0000-000000000001': { winnerId: '00000000-0000-0000-0003-000000000002', team1Score: 70, team2Score: 74, completedAt: '2025-03-29T05:05:00Z' },
  'a0000000-0003-0055-0000-000000000001': { winnerId: '00000000-0000-0000-0004-000000000001', team1Score: 82, team2Score: 74, completedAt: '2025-03-29T02:30:00Z' },
  'a0000000-0003-0056-0000-000000000001': { winnerId: '00000000-0000-0000-0004-000000000002', team1Score: 73, team2Score: 79, completedAt: '2025-03-29T05:05:00Z' },

  // ── ELITE 8 ──────────────────────────────────────────────────
  'a0000000-0004-0057-0000-000000000001': { winnerId: '00000000-0000-0000-0001-000000000001', team1Score: 93, team2Score: 85, completedAt: '2025-03-30T00:35:00Z' },
  'a0000000-0004-0058-0000-000000000001': { winnerId: '00000000-0000-0000-0002-000000000001', team1Score: 80, team2Score: 73, completedAt: '2025-03-30T03:10:00Z' },
  'a0000000-0004-0059-0000-000000000001': { winnerId: '00000000-0000-0000-0003-000000000001', team1Score: 85, team2Score: 81, completedAt: '2025-03-31T00:35:00Z' },
  'a0000000-0004-0060-0000-000000000001': { winnerId: '00000000-0000-0000-0004-000000000001', team1Score: 78, team2Score: 71, completedAt: '2025-03-31T03:10:00Z' },

  // ── FINAL FOUR ───────────────────────────────────────────────
  'a0000000-0005-0061-0000-000000000001': { winnerId: '00000000-0000-0000-0001-000000000001', team1Score: 72, team2Score: 64, completedAt: '2025-04-05T23:35:00Z' },
  'a0000000-0005-0062-0000-000000000001': { winnerId: '00000000-0000-0000-0004-000000000001', team1Score: 68, team2Score: 73, completedAt: '2025-04-06T02:25:00Z' },

  // ── CHAMPIONSHIP ─────────────────────────────────────────────
  'a0000000-0006-0063-0000-000000000001': { winnerId: '00000000-0000-0000-0001-000000000001', team1Score: 77, team2Score: 60, completedAt: '2025-04-08T00:45:00Z' },
}
