/**
 * TEMP TEST PAGE — remove before/after confirming design looks good.
 * Renders BracketRoundBreakdown with mock mid-tournament data.
 * No auth required — safe to load on mobile via ufsl-bracket-test.vercel.app/test-breakdown
 */

import BracketRoundBreakdown from '@/components/BracketRoundBreakdown'
import type { Game } from '@/types/database'

// Mock game IDs
const G = (id: string) => id

// Build 63 mock games spanning rounds 1–6
// Round 1: 32 games (8 completed), Round 2: 16 games (8 completed), Round 3+: not started
function buildMockGames(): Game[] {
  const games: Game[] = []
  const regions = ['East', 'West', 'South', 'Midwest']
  let gameNum = 1

  for (let round = 1; round <= 6; round++) {
    const count = round === 1 ? 32 : round === 2 ? 16 : round === 3 ? 8 : round === 4 ? 4 : round === 5 ? 2 : 1
    for (let g = 0; g < count; g++) {
      const id = `game-r${round}-g${g + 1}`
      const region = round <= 4 ? regions[Math.floor(g / (count / 4))] : 'Final'
      // R1: 32 games, first 24 completed. R2: 16 games, first 8 completed.
      const completed =
        (round === 1 && g < 24) ||
        (round === 2 && g < 8)
      const winnerId = `team-winner-r${round}-g${g + 1}`
      games.push({
        id,
        season: 2026,
        round,
        region,
        game_number: gameNum++,
        team1_id: `team-a-r${round}-g${g + 1}`,
        team2_id: `team-b-r${round}-g${g + 1}`,
        winner_id: completed ? winnerId : null,
        team1_score: completed ? 78 : null,
        team2_score: completed ? 65 : null,
        status: completed ? 'completed' : round <= 2 ? 'in_progress' : 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as Game)
    }
  }
  return games
}

const MOCK_GAMES = buildMockGames()

// Mock picks: correctly picked 18/24 R1 completed, 5/8 R2 completed
function buildMockPicks(correctR1: number, correctR2: number): Record<string, string> {
  const picks: Record<string, string> = {}
  for (let g = 0; g < 24; g++) {
    const id = `game-r1-g${g + 1}`
    const winnerId = `team-winner-r1-g${g + 1}`
    const wrongId = `team-a-r1-g${g + 1}` // wrong pick
    picks[id] = g < correctR1 ? winnerId : wrongId
  }
  // R2 picks
  for (let g = 0; g < 8; g++) {
    const id = `game-r2-g${g + 1}`
    const winnerId = `team-winner-r2-g${g + 1}`
    const wrongId = `team-a-r2-g${g + 1}`
    picks[id] = g < correctR2 ? winnerId : wrongId
  }
  // R3+ picks (not completed, but picked)
  for (let round = 3; round <= 6; round++) {
    const count = round === 3 ? 8 : round === 4 ? 4 : round === 5 ? 2 : 1
    for (let g = 0; g < count; g++) {
      picks[`game-r${round}-g${g + 1}`] = `team-winner-r${round}-g${g + 1}`
    }
  }
  return picks
}

const SCENARIOS = [
  { label: 'Crushing it', r1: 22, r2: 7, accent: 'text-green-400' },
  { label: 'Doing OK', r1: 18, r2: 5, accent: 'text-yellow-400' },
  { label: 'Rough start', r1: 12, r2: 3, accent: 'text-red-400' },
  { label: 'Perfect R1', r1: 24, r2: 8, accent: 'text-green-400' },
]

export default function TestBreakdownPage() {
  return (
    <div className="min-h-screen bg-brand-dark text-brand-text p-4 space-y-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-lg font-bold mb-1">Round Breakdown — Design Test</h1>
        <p className="text-xs text-brand-muted mb-6">Mobile preview. Remove this page before launch.</p>

        {SCENARIOS.map((scenario) => {
          const picks = buildMockPicks(scenario.r1, scenario.r2)
          return (
            <div
              key={scenario.label}
              className="block bg-brand-surface border border-brand-border rounded-xl p-4 mb-3"
            >
              {/* Simulate full bracket card layout */}
              <div className="grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-1">
                {/* Col 1: name + pool */}
                <div className="flex items-start gap-2 min-w-0">
                  <span className="text-lg shrink-0 mt-0.5">🏀</span>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">My Bracket</div>
                    <div className="text-xs text-brand-muted truncate">Westlake Warriors</div>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-green-400">
                      <span>🏆</span>
                      <span>Duke</span>
                      <span className="opacity-50">· 22% picked</span>
                    </div>
                  </div>
                </div>

                {/* Col 2: round breakdown */}
                <div>
                  <BracketRoundBreakdown picks={picks} games={MOCK_GAMES} />
                </div>

                {/* Col 3: rank + score */}
                <div className="text-right shrink-0 flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-white leading-none">#2</span>
                    <span className="text-[10px] text-brand-muted">of 9</span>
                  </div>
                  <div>
                    <div className={`text-base font-black leading-tight ${scenario.accent}`}>
                      {scenario.r1 + scenario.r2 * 2}
                      <span className="text-brand-muted font-normal text-xs"> / 192</span>
                    </div>
                    <div className="text-[10px] text-brand-muted">pts</div>
                  </div>
                </div>
              </div>

              <div className="mt-2 text-xs text-brand-muted">Scenario: <span className="font-semibold text-white">{scenario.label}</span> — R1: {scenario.r1}/24, R2: {scenario.r2}/8</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
