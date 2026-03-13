/**
 * Bracket advancement map — defines which game a winner advances to
 * and whether they become team1 or team2 in that game.
 *
 * Game numbers follow the seeded test structure:
 *   R1: 1-32, R2: 33-48, R3: 49-56, R4: 57-60, R5: 61-62
 */

export interface Advancement {
  nextGameNumber: number
  slot: 'team1_id' | 'team2_id'
}

export const BRACKET_ADVANCEMENT: Record<number, Advancement> = {
  // R1 → R2 (pairs of R1 games feed one R2 game)
  1:  { nextGameNumber: 33, slot: 'team1_id' },
  2:  { nextGameNumber: 33, slot: 'team2_id' },
  3:  { nextGameNumber: 34, slot: 'team1_id' },
  4:  { nextGameNumber: 34, slot: 'team2_id' },
  5:  { nextGameNumber: 35, slot: 'team1_id' },
  6:  { nextGameNumber: 35, slot: 'team2_id' },
  7:  { nextGameNumber: 36, slot: 'team1_id' },
  8:  { nextGameNumber: 36, slot: 'team2_id' },
  9:  { nextGameNumber: 37, slot: 'team1_id' },
  10: { nextGameNumber: 37, slot: 'team2_id' },
  11: { nextGameNumber: 38, slot: 'team1_id' },
  12: { nextGameNumber: 38, slot: 'team2_id' },
  13: { nextGameNumber: 39, slot: 'team1_id' },
  14: { nextGameNumber: 39, slot: 'team2_id' },
  15: { nextGameNumber: 40, slot: 'team1_id' },
  16: { nextGameNumber: 40, slot: 'team2_id' },
  17: { nextGameNumber: 41, slot: 'team1_id' },
  18: { nextGameNumber: 41, slot: 'team2_id' },
  19: { nextGameNumber: 42, slot: 'team1_id' },
  20: { nextGameNumber: 42, slot: 'team2_id' },
  21: { nextGameNumber: 43, slot: 'team1_id' },
  22: { nextGameNumber: 43, slot: 'team2_id' },
  23: { nextGameNumber: 44, slot: 'team1_id' },
  24: { nextGameNumber: 44, slot: 'team2_id' },
  25: { nextGameNumber: 45, slot: 'team1_id' },
  26: { nextGameNumber: 45, slot: 'team2_id' },
  27: { nextGameNumber: 46, slot: 'team1_id' },
  28: { nextGameNumber: 46, slot: 'team2_id' },
  29: { nextGameNumber: 47, slot: 'team1_id' },
  30: { nextGameNumber: 47, slot: 'team2_id' },
  31: { nextGameNumber: 48, slot: 'team1_id' },
  32: { nextGameNumber: 48, slot: 'team2_id' },
  // R2 → R3
  33: { nextGameNumber: 49, slot: 'team1_id' },
  34: { nextGameNumber: 49, slot: 'team2_id' },
  35: { nextGameNumber: 53, slot: 'team1_id' },
  36: { nextGameNumber: 53, slot: 'team2_id' },
  37: { nextGameNumber: 50, slot: 'team1_id' },
  38: { nextGameNumber: 50, slot: 'team2_id' },
  39: { nextGameNumber: 54, slot: 'team1_id' },
  40: { nextGameNumber: 54, slot: 'team2_id' },
  41: { nextGameNumber: 51, slot: 'team1_id' },
  42: { nextGameNumber: 51, slot: 'team2_id' },
  43: { nextGameNumber: 55, slot: 'team1_id' },
  44: { nextGameNumber: 55, slot: 'team2_id' },
  45: { nextGameNumber: 52, slot: 'team1_id' },
  46: { nextGameNumber: 52, slot: 'team2_id' },
  47: { nextGameNumber: 56, slot: 'team1_id' },
  48: { nextGameNumber: 56, slot: 'team2_id' },
  // R3 → R4 (Elite 8)
  49: { nextGameNumber: 57, slot: 'team1_id' },
  53: { nextGameNumber: 57, slot: 'team2_id' },
  50: { nextGameNumber: 58, slot: 'team1_id' },
  54: { nextGameNumber: 58, slot: 'team2_id' },
  51: { nextGameNumber: 59, slot: 'team1_id' },
  55: { nextGameNumber: 59, slot: 'team2_id' },
  52: { nextGameNumber: 60, slot: 'team1_id' },
  56: { nextGameNumber: 60, slot: 'team2_id' },
  // R4 → R5 (Final Four)
  57: { nextGameNumber: 61, slot: 'team1_id' },
  58: { nextGameNumber: 61, slot: 'team2_id' },
  59: { nextGameNumber: 62, slot: 'team1_id' },
  60: { nextGameNumber: 62, slot: 'team2_id' },
  // R5 → R6 (Championship) — game 63 if it exists
  61: { nextGameNumber: 63, slot: 'team1_id' },
  62: { nextGameNumber: 63, slot: 'team2_id' },
}

/**
 * Advance a winner to their next bracket game.
 * Call after marking a game complete.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function advanceWinner(db: any, gameNumber: number, winnerId: string): Promise<void> {
  const adv = BRACKET_ADVANCEMENT[gameNumber]
  if (!adv) return // R6 champion — no next game

  await db
    .from('games')
    .update({ [adv.slot]: winnerId })
    .eq('game_number', adv.nextGameNumber)
}
