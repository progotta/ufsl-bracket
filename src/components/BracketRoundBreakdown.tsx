'use client'

import type { Game } from '@/types/database'
import { computeRoundBreakdown, computeBadgesFromGames } from '@/lib/bracketUtils'

interface BracketRoundBreakdownProps {
  picks: Record<string, string>
  games: Game[]
  isLeading?: boolean
}

const ROUND_HEADERS = ['R64', 'R32', 'S16', 'E8', 'F4', '🏆']

export default function BracketRoundBreakdown({ picks, games, isLeading = false }: BracketRoundBreakdownProps) {
  const breakdown = computeRoundBreakdown(picks, games)
  const badges = computeBadgesFromGames(picks, games, isLeading)

  // Don't render anything if tournament hasn't started
  const anyStarted = breakdown.some(rd => rd.started)
  if (!anyStarted) return null

  return (
    <div className="space-y-1.5">
      {/* Round grid — Sleeper-style columns */}
      <div className="grid grid-cols-6 gap-x-1 text-center">
        {breakdown.map((rd, i) => {
          const label = ROUND_HEADERS[i]
          const ratio = rd.started && rd.total > 0 ? rd.correct / rd.total : null

          const scoreColor =
            !rd.started ? 'text-brand-muted/40' :
            ratio === null ? 'text-brand-muted/40' :
            ratio >= 0.75 ? 'text-green-400' :
            ratio >= 0.5 ? 'text-yellow-400' :
            'text-red-400'

          return (
            <div key={rd.round} className="flex flex-col items-center gap-0.5">
              {/* Round label */}
              <span className="text-[9px] font-semibold text-brand-muted/60 uppercase tracking-wide leading-none">
                {label}
              </span>
              {/* Score */}
              <span className={`text-xs font-bold leading-none tabular-nums ${scoreColor}`}>
                {!rd.started ? '—' : rd.correct}
              </span>
              {/* Total (denominator) — small and muted */}
              {rd.started && (
                <span className="text-[9px] text-brand-muted/50 leading-none tabular-nums">
                  /{rd.total}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {badges.map((badge, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-0.5 text-[10px] bg-white/5 border border-white/10 rounded-full px-1.5 py-0.5"
              title={badge.label}
            >
              {badge.emoji} {badge.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
