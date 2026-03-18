/**
 * TEMP TEST PAGE — remove after design approval.
 * No auth required.
 */

import BracketRoundBreakdown from '@/components/BracketRoundBreakdown'
import type { Game } from '@/types/database'

function buildMockGames(): Game[] {
  const games: Game[] = []
  const regions = ['East', 'West', 'South', 'Midwest']
  let gameNum = 1
  for (let round = 1; round <= 6; round++) {
    const count = [0, 32, 16, 8, 4, 2, 1][round]
    for (let g = 0; g < count; g++) {
      const id = `game-r${round}-g${g + 1}`
      const region = round <= 4 ? regions[Math.floor(g / (count / 4))] : 'Final'
      const completed = (round === 1 && g < 24) || (round === 2 && g < 8)
      const winnerId = `team-winner-r${round}-g${g + 1}`
      games.push({
        id, season: 2026, round, region, game_number: gameNum++,
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

function buildMockPicks(correctR1: number, correctR2: number): Record<string, string> {
  const picks: Record<string, string> = {}
  for (let g = 0; g < 32; g++) {
    const id = `game-r1-g${g + 1}`
    picks[id] = g < correctR1 ? `team-winner-r1-g${g + 1}` : `team-a-r1-g${g + 1}`
  }
  for (let g = 0; g < 16; g++) {
    const id = `game-r2-g${g + 1}`
    picks[id] = g < correctR2 ? `team-winner-r2-g${g + 1}` : `team-a-r2-g${g + 1}`
  }
  for (let round = 3; round <= 6; round++) {
    const count = [0, 0, 0, 8, 4, 2, 1][round]
    for (let g = 0; g < count; g++) {
      picks[`game-r${round}-g${g + 1}`] = `team-winner-r${round}-g${g + 1}`
    }
  }
  return picks
}

const SCENARIOS = [
  { label: 'Crushing it',  r1: 22, r2: 7, score: 36, rank: 1 },
  { label: 'Doing OK',     r1: 18, r2: 5, score: 28, rank: 3 },
  { label: 'Rough start',  r1: 12, r2: 3, score: 18, rank: 7 },
  { label: 'Perfect R1',   r1: 24, r2: 8, score: 40, rank: 1 },
]

export default function TestBreakdownPage() {
  return (
    <div className="min-h-screen bg-brand-dark text-brand-text p-4 space-y-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-base font-bold mb-0.5">Round Breakdown — Design Test</h1>
        <p className="text-xs text-brand-muted mb-5">Mobile preview (390px). Remove before launch.</p>

        {SCENARIOS.map((scenario) => {
          const picks = buildMockPicks(scenario.r1, scenario.r2)
          return (
            <div key={scenario.label} className="bg-brand-surface border border-brand-border rounded-xl p-4 mb-3">

              {/* Row 1: Name + pool (left) | Rank + Score (right) */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-2 min-w-0">
                  <span className="text-lg shrink-0 mt-0.5">🏀</span>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">My Bracket</div>
                    <div className="text-xs text-brand-muted">Westlake Warriors</div>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-green-400">
                      <span>🏆</span><span>Duke</span>
                      <span className="text-brand-muted/60">· 22% picked</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-white leading-none">#{scenario.rank}</span>
                    <span className="text-[10px] text-brand-muted">of 9</span>
                  </div>
                  <div>
                    <div className="text-base font-black text-brand-orange leading-tight">
                      {scenario.score}
                      <span className="text-brand-muted font-normal text-xs"> / 192</span>
                    </div>
                    <div className="text-[10px] text-brand-muted">pts</div>
                  </div>
                </div>
              </div>

              {/* Row 2: Round breakdown — full width */}
              <BracketRoundBreakdown picks={picks} games={MOCK_GAMES} />

              <div className="mt-3 pt-2 border-t border-brand-border/50 text-[10px] text-brand-muted">
                Scenario: <span className="font-semibold text-white">{scenario.label}</span> — R1: {scenario.r1}/24, R2: {scenario.r2}/8
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
