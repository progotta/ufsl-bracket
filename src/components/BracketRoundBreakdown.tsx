'use client'

import type { Game } from '@/types/database'
import { computeRoundBreakdown, computeBadgesFromGames } from '@/lib/bracketUtils'

interface BracketRoundBreakdownProps {
  picks: Record<string, string>
  games: Game[]
  isLeading?: boolean
}

export default function BracketRoundBreakdown({ picks, games, isLeading = false }: BracketRoundBreakdownProps) {
  const breakdown = computeRoundBreakdown(picks, games)
  const badges = computeBadgesFromGames(picks, games, isLeading)

  // Overall progress
  let totalCorrect = 0
  let totalPossible = 0
  for (const rd of breakdown) {
    if (rd.started) {
      totalCorrect += rd.correct
      // Count only completed games for the denominator
      const roundGames = games.filter(g => g.round === rd.round)
      const completed = roundGames.filter(g => g.status === 'completed').length
      totalPossible += completed
    }
  }
  const pct = totalPossible > 0 ? Math.round((totalCorrect / totalPossible) * 100) : 0

  // Don't render anything if tournament hasn't started
  const anyStarted = breakdown.some(rd => rd.started)
  if (!anyStarted) return null

  return (
    <div className="mt-2 space-y-1.5">
      {/* Round breakdown row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {breakdown.map((rd) => {
          if (!rd.started) {
            return (
              <span key={rd.round} className="text-gray-600">
                <span className="font-medium">{rd.label}:</span>{' '}
                <span>—</span>
              </span>
            )
          }

          const ratio = rd.total > 0 ? rd.correct / rd.total : 0
          const colorClass =
            ratio >= 1 ? 'text-green-400' :
            ratio > 0.75 ? 'text-green-400' :
            ratio >= 0.5 ? 'text-yellow-400' :
            'text-red-400'

          return (
            <span key={rd.round} className={colorClass}>
              <span className="font-medium">{rd.label}:</span>{' '}
              <span className="font-bold">{rd.correct}</span>
              <span className="opacity-60">/{rd.total}</span>
            </span>
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
