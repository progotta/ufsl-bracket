/**
 * TEMP TEST PAGE — remove after design approval.
 * Shows proposed leaderboard row redesign with 2-row layout + round grid.
 * No auth required. Visit /test-leaderboard on mobile.
 */

const ROUND_HEADERS = ['R64', 'R32', 'S16', 'E8', 'F4', '🏆']

interface RoundData { correct: number; total: number; started: boolean }
interface MockEntry {
  rank: number
  name: string
  bracketName: string
  isMe?: boolean
  score: number
  maxScore: number
  movement: number | null
  rounds: RoundData[]
}

const NOT_STARTED: RoundData = { correct: 0, total: 0, started: false }

const ENTRIES: MockEntry[] = [
  {
    rank: 1, name: 'ChaseT', bracketName: 'Duke All Day',
    score: 40, maxScore: 192, movement: 2,
    rounds: [
      { correct: 24, total: 32, started: true },
      { correct: 8,  total: 16, started: true },
      NOT_STARTED, NOT_STARTED, NOT_STARTED, NOT_STARTED,
    ],
  },
  {
    rank: 2, name: 'Shawn S', bracketName: 'Westlake Warriors', isMe: true,
    score: 36, maxScore: 176, movement: 0,
    rounds: [
      { correct: 22, total: 32, started: true },
      { correct: 7,  total: 16, started: true },
      NOT_STARTED, NOT_STARTED, NOT_STARTED, NOT_STARTED,
    ],
  },
  {
    rank: 3, name: 'MikeyD', bracketName: 'Chaos Theory',
    score: 28, maxScore: 192, movement: -1,
    rounds: [
      { correct: 18, total: 32, started: true },
      { correct: 5,  total: 16, started: true },
      NOT_STARTED, NOT_STARTED, NOT_STARTED, NOT_STARTED,
    ],
  },
  {
    rank: 4, name: 'KristenB', bracketName: 'Final Four Fun',
    score: 22, maxScore: 160, movement: 1,
    rounds: [
      { correct: 14, total: 32, started: true },
      { correct: 4,  total: 16, started: true },
      NOT_STARTED, NOT_STARTED, NOT_STARTED, NOT_STARTED,
    ],
  },
  {
    rank: 5, name: 'TodM', bracketName: 'Bracketology',
    score: 18, maxScore: 144, movement: -2,
    rounds: [
      { correct: 12, total: 32, started: true },
      { correct: 3,  total: 16, started: true },
      NOT_STARTED, NOT_STARTED, NOT_STARTED, NOT_STARTED,
    ],
  },
]

function MovementBadge({ movement }: { movement: number | null }) {
  if (movement === null) return null
  if (movement > 0) return <span className="text-green-400 text-[10px] font-bold">▲{movement}</span>
  if (movement < 0) return <span className="text-red-400 text-[10px] font-bold">▼{Math.abs(movement)}</span>
  return <span className="text-brand-muted text-[10px]">—</span>
}

function RoundGrid({ rounds }: { rounds: RoundData[] }) {
  const anyStarted = rounds.some(r => r.started)
  if (!anyStarted) return null

  return (
    <div className="grid grid-cols-6 border border-brand-border/60 rounded-lg overflow-hidden">
      {rounds.map((rd, i) => {
        const ratio = rd.started && rd.total > 0 ? rd.correct / rd.total : null
        const scoreColor =
          !rd.started ? 'text-brand-muted/30' :
          ratio === null ? 'text-brand-muted/30' :
          ratio >= 0.75 ? 'text-green-400' :
          ratio >= 0.5 ? 'text-yellow-400' :
          'text-red-400'
        const bgColor =
          !rd.started ? '' :
          ratio !== null && ratio >= 0.75 ? 'bg-green-500/5' :
          ratio !== null && ratio >= 0.5 ? 'bg-yellow-500/5' :
          ratio !== null ? 'bg-red-500/5' : ''

        return (
          <div
            key={i}
            className={`flex flex-col items-center py-1.5 ${bgColor} ${i > 0 ? 'border-l border-brand-border/60' : ''}`}
          >
            <span className="text-[9px] font-semibold text-brand-muted/50 uppercase tracking-wide leading-none mb-1">
              {ROUND_HEADERS[i]}
            </span>
            <span className={`text-sm font-bold leading-none tabular-nums ${scoreColor}`}>
              {!rd.started ? '—' : rd.correct}
            </span>
            <span className="text-[9px] text-brand-muted/40 leading-none mt-0.5 tabular-nums">
              {rd.started ? `/${rd.total}` : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function LeaderboardRow({ entry }: { entry: MockEntry }) {
  const avatarLetter = entry.name[0].toUpperCase()
  const borderClass = entry.isMe
    ? 'border-l-2 border-l-brand-orange bg-brand-orange/5'
    : 'border-t border-brand-border hover:bg-brand-card/50'

  const rankColor =
    entry.rank === 1 ? 'text-yellow-400 font-bold' :
    entry.rank === 2 ? 'text-slate-300 font-bold' :
    entry.rank === 3 ? 'text-amber-600 font-bold' :
    'text-brand-muted font-medium'

  return (
    <div className={`px-4 py-2.5 transition-colors ${borderClass}`}>
      {/* Row 1: Rank | Avatar + Name | movement | score */}
      <div className="flex items-center gap-2.5 mb-2">
        {/* Rank */}
        <span className={`text-sm tabular-nums w-7 text-center shrink-0 ${rankColor}`}>
          #{entry.rank}
        </span>

        {/* Avatar */}
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          entry.isMe ? 'bg-brand-orange/20 text-brand-orange ring-1 ring-brand-orange' : 'bg-brand-card text-brand-muted'
        }`}>
          {avatarLetter}
        </div>

        {/* Name + bracket */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium truncate ${entry.isMe ? 'text-brand-orange' : 'text-brand-text'}`}>
            {entry.name}
            {entry.isMe && <span className="text-xs ml-1 text-brand-muted font-normal">(you)</span>}
          </div>
          <div className="text-[11px] text-brand-muted truncate">{entry.bracketName}</div>
        </div>

        {/* Movement */}
        <MovementBadge movement={entry.movement} />

        {/* Score */}
        <div className="text-right shrink-0">
          <div className={`text-sm font-bold tabular-nums ${entry.isMe ? 'text-brand-orange' : 'text-white'}`}>
            {entry.score}
          </div>
          <div className="text-[10px] text-brand-muted tabular-nums">/{entry.maxScore}</div>
        </div>
      </div>

      {/* Row 2: Round grid */}
      <RoundGrid rounds={entry.rounds} />
    </div>
  )
}

export default function TestLeaderboardPage() {
  return (
    <div className="min-h-screen bg-brand-dark text-brand-text p-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-base font-bold mb-0.5">Leaderboard Row — Design Test</h1>
        <p className="text-xs text-brand-muted mb-5">Mobile preview. Remove before launch.</p>

        {/* Simulated leaderboard */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <span className="font-bold text-sm">Westlake Warriors</span>
            </div>
            <span className="text-xs text-brand-muted">5 players</span>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[2rem_2rem_1fr_auto_auto] gap-2 px-4 py-2 border-b border-brand-border bg-brand-card/30 text-[10px] font-semibold text-brand-muted uppercase tracking-wide">
            <span className="text-center">Rk</span>
            <span></span>
            <span>Player</span>
            <span className="text-right">±</span>
            <span className="text-right">Score</span>
          </div>

          {/* Rows */}
          {ENTRIES.map((entry) => (
            <LeaderboardRow key={entry.rank} entry={entry} />
          ))}

          {/* Footer */}
          <div className="px-4 py-3 border-t border-brand-border bg-brand-card/20 flex items-center justify-between">
            <span className="text-xs text-brand-muted">5 players</span>
            <span className="text-xs text-brand-orange">View Global Rankings →</span>
          </div>
        </div>

        <p className="text-[10px] text-brand-muted mt-4">
          ⚠️ Per-round data (R64/R32 counts) needs a leaderboard API update to work live — 
          currently only total score is returned. Easy to add; just want design approval first.
        </p>
      </div>
    </div>
  )
}
