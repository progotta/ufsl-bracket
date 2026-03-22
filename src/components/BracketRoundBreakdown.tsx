'use client'

import type { Game } from '@/types/database'
import { computeRoundBreakdown, computeBadgesFromGames } from '@/lib/bracketUtils'

interface BracketRoundBreakdownProps {
  picks: Record<string, string>
  games: Game[]
  isLeading?: boolean
}

const ROUND_HEADERS = ['R64', 'R32', 'S16', 'E8', 'F4', '🏆']
const ROUND_PTS = [1, 2, 4, 8, 16, 32]

export default function BracketRoundBreakdown({ picks, games, isLeading = false }: BracketRoundBreakdownProps) {
  const breakdown = computeRoundBreakdown(picks, games)
  const badges = computeBadgesFromGames(picks, games, isLeading)

  // Derive current active round from game statuses
  let currentRound = 1
  for (let r = 1; r <= 6; r++) {
    const rGames = games.filter(g => g.round === r)
    if (rGames.length > 0 && rGames.some(g => g.status !== 'completed')) { currentRound = r; break }
    if (r === 6) currentRound = 6
  }

  return (
    <div className="space-y-2">
      {/* Round grid — full width, 6 equal columns */}
      <div className="grid grid-cols-6 border border-brand-border/60 rounded-lg overflow-hidden">
        {breakdown.map((rd, i) => {
          const header = ROUND_HEADERS[i]
          const ratio = rd.started && rd.total > 0 ? rd.correct / rd.total : null
          const pts = rd.started ? rd.correct * ROUND_PTS[i] : null
          const isActive = rd.round === currentRound
          const isPast = rd.round < currentRound

          const headerColor = isActive
            ? 'text-green-400 font-bold'
            : isPast ? 'text-green-600/60' : 'text-brand-muted/40'

          const scoreColor = isActive
            ? (!rd.started ? 'text-brand-muted/40' :
                ratio === null ? 'text-brand-muted/40' :
                ratio >= 0.75 ? 'text-green-400' :
                ratio >= 0.5 ? 'text-yellow-400' : 'text-red-400')
            : isPast
              ? (!rd.started ? 'text-brand-muted/30' :
                  ratio === null ? 'text-brand-muted/30' :
                  ratio >= 0.75 ? 'text-green-600/60' :
                  ratio >= 0.5 ? 'text-yellow-600/60' : 'text-red-600/60')
              : 'text-brand-muted/25'

          const bgColor = isActive ? 'bg-green-500/10' : ''
          const borderTop = isActive ? 'border-t-2 border-green-400' : 'border-t-2 border-transparent'

          return (
            <div
              key={rd.round}
              className={`flex flex-col items-center py-2.5 gap-0.5 ${bgColor} ${borderTop} ${i > 0 ? 'border-l border-brand-border/60' : ''}`}
            >
              <span className={`text-[9px] uppercase tracking-wide leading-none ${headerColor}`}>
                {header}
              </span>
              <span className={`text-base font-bold leading-none tabular-nums ${scoreColor}`}>
                {!rd.started ? '—' : pts}
              </span>
              <span className={`text-[9px] leading-none tabular-nums ${rd.started ? scoreColor + ' opacity-60' : 'text-brand-muted/30'}`}>
                {rd.started ? `(${rd.correct}W)` : ''}
              </span>
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
