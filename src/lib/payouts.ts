export type PayoutStructure =
  | { type: 'winner_take_all' }
  | { type: 'top2'; splits: [number, number] }
  | { type: 'top3'; splits: [number, number, number] }
  | { type: 'custom'; splits: Array<{ place: number; pct: number }> }

export const PRESET_PAYOUTS = [
  { label: 'Winner Take All', value: { type: 'winner_take_all' } },
  { label: 'Top 2 (70/30)', value: { type: 'top2', splits: [70, 30] } },
  { label: 'Top 3 (60/25/15)', value: { type: 'top3', splits: [60, 25, 15] } },
  { label: 'Top 3 (50/30/20)', value: { type: 'top3', splits: [50, 30, 20] } },
] as const

export function calculatePayouts(
  totalPot: number,
  structure: PayoutStructure,
  paidCount: number
): Array<{ place: number; amount: number; label: string }> {
  const pot = totalPot

  if (structure.type === 'winner_take_all') {
    return [{ place: 1, amount: pot, label: '🥇 1st Place' }]
  }

  const splits = structure.type === 'top2' ? structure.splits
    : structure.type === 'top3' ? structure.splits
    : structure.splits.map(s => s.pct)

  return splits.map((pct, i) => ({
    place: i + 1,
    amount: Math.floor((pot * pct) / 100 * 100) / 100,
    label: i === 0 ? '🥇 1st Place' : i === 1 ? '🥈 2nd Place' : `🥉 ${i + 1}rd Place`,
  }))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

// Consolation prizes for positions that don't receive a monetary payout
// Shown on the leaderboard whenever a pool has a payout structure but a rank isn't in the paid spots
export const CONSOLATION_PRIZES = [
  'Enlightenment',       // 2nd — the classic
  'Vibes',               // 3rd — chef's kiss
  'Inner Peace',
  'Moral Superiority',
  'A Firm Handshake',
  'Eternal Glory',
  'Bragging Rights (Unofficial)',
  'The Warmth of Knowing',
  'Spiritual Growth',
  'A Great Story to Tell',
  'The Respect of Your Peers',
  'Character Building',
  'Humble Pie',
  'Unbridled Optimism',
  'A Sense of Closure',
  'Participation Energy',
  'Lifelong Memories',
  'The Journey Itself',
  'Happiness',
  'Satisfaction',
]

/**
 * Returns a consolation prize label for a given rank (1-indexed).
 * Rank 1 should never need this — it's for ranks that don't pay out money.
 */
export function getConsolationPrize(rank: number): string {
  // rank 2 → index 0 ("Enlightenment"), rank 3 → index 1 ("Vibes"), etc.
  const idx = (rank - 2) % CONSOLATION_PRIZES.length
  return CONSOLATION_PRIZES[Math.max(0, idx)]
}
