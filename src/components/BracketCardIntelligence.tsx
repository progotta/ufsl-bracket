'use client'

import type { BracketIntelligence } from '@/lib/bracketIntelligence'

const SOURCE_STYLES: Record<string, string> = {
  ESPN: 'bg-red-500/20 text-red-400 border-red-500/30',
  CBS: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Yahoo: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  UFSL: 'bg-brand-orange/20 text-brand-orange border-brand-orange/30',
}

function formatNumber(n: number): string {
  return n >= 1000 ? n.toLocaleString() : String(n)
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (isToday) return `Today ${time}`
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow ${time}`
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${time}`
}

export default function BracketCardIntelligence({ intel }: { intel: BracketIntelligence }) {
  const {
    source,
    currentScore,
    maxPossibleScore,
    currentRank,
    poolSize,
    bestPossibleRank,
    canWin,
    isEliminated,
    championAbbreviation,
    championAlive,
    championPopularity,
    nextGame,
    memberCount,
  } = intel

  // Only show tournament-started data if there are scores
  const tournamentStarted = championAlive !== null

  return (
    <div className="mt-2 space-y-1.5">
      {/* Row 1: Pool size */}
      <div className="flex items-center justify-end">
        <span className="text-[10px] text-brand-muted">
          {memberCount} player{memberCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Row 2: Points + Rank (only when tournament has started) */}
      {tournamentStarted && (
        <div className="flex items-center justify-between text-xs">
          <span>
            <span className="font-bold text-brand-orange">{formatNumber(currentScore)} pts</span>
            <span className="text-brand-muted"> | max {formatNumber(maxPossibleScore)}</span>
          </span>
          <span>
            <span className="font-bold">#{currentRank}</span>
            <span className="text-brand-muted"> of {poolSize}</span>
            {isEliminated ? (
              <span className="text-red-400 ml-1">| 💀 eliminated</span>
            ) : canWin ? (
              <span className="text-green-400 ml-1">| 🏆 can win</span>
            ) : (
              <span className="text-brand-muted ml-1">| best: #{bestPossibleRank}</span>
            )}
          </span>
        </div>
      )}

      {/* Row 3: Champion status + next game */}
      <div className="flex items-center justify-between text-xs">
        {championAbbreviation ? (
          <span className={
            championAlive === null
              ? 'text-brand-muted'
              : championAlive
                ? 'text-green-400'
                : 'text-red-400/60'
          }>
            {championAlive === false ? '💀' : '🏆'}{' '}
            {championAbbreviation}{' '}
            {championAlive === null ? '' : championAlive ? 'alive' : 'out'}
            {championPopularity !== null && (
              <span className="text-brand-muted ml-1">({championPopularity}% of pool)</span>
            )}
          </span>
        ) : (
          <span className="text-brand-muted text-[10px]">No champion pick</span>
        )}

        {nextGame && (
          <span className="text-brand-muted truncate ml-2 text-[10px]">
            {nextGame.isLive ? (
              <>
                <span className="text-red-400 font-bold">Live 🔴</span>{' '}
                {nextGame.team1Abbr} vs {nextGame.team2Abbr}
              </>
            ) : (
              <>
                Next: {nextGame.team1Abbr} vs {nextGame.team2Abbr}
                {nextGame.scheduledAt && (
                  <span className="ml-1">{formatTime(nextGame.scheduledAt)}</span>
                )}
              </>
            )}
          </span>
        )}
      </div>
    </div>
  )
}
