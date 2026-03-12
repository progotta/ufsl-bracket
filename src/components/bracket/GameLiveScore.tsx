'use client'

import { type LiveGameScore } from '@/lib/liveScores'
import clsx from 'clsx'

interface GameLiveScoreProps {
  game: LiveGameScore
  /** Team ID the user picked to win this game (for color coding) */
  userPickTeamId?: string
  /** Compact = single-line inline; default = card */
  variant?: 'compact' | 'card'
}

/**
 * Inline score display for a game that is in-progress, halftime, or completed.
 * Shows LIVE badge, scores, period/clock, and color-codes user's pick.
 */
export default function GameLiveScore({ game, userPickTeamId, variant = 'compact' }: GameLiveScoreProps) {
  const isLive = game.status === 'in_progress' || game.status === 'halftime'
  const isFinal = game.status === 'completed'

  // Pick outcome coloring
  const pickTeam = userPickTeamId
    ? (game.team1.id === userPickTeamId
        ? game.team1
        : game.team2.id === userPickTeamId
        ? game.team2
        : null)
    : null

  const pickIsWinning = pickTeam?.isWinning ?? null
  const pickColor =
    pickIsWinning === true
      ? 'text-green-400'
      : pickIsWinning === false
      ? 'text-red-400'
      : null

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        {/* Live badge */}
        {isLive && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </span>
        )}
        {isFinal && (
          <span className="px-1.5 py-0.5 rounded-full bg-brand-surface border border-brand-border text-brand-muted font-medium">
            Final
          </span>
        )}

        {/* Close game indicator */}
        {isLive && game.isClose && (
          <span className="text-brand-gold text-xs">🔥</span>
        )}

        {/* Scores */}
        <span className="font-mono font-bold text-white">
          <TeamScore team={game.team1} userPickId={userPickTeamId} />
          <span className="text-brand-muted mx-0.5">–</span>
          <TeamScore team={game.team2} userPickId={userPickTeamId} />
        </span>

        {/* Clock */}
        <span className="text-brand-muted truncate">{game.clock}</span>

        {/* User pick status */}
        {pickColor && (
          <span className={clsx('font-bold', pickColor)}>
            {pickIsWinning ? '✓' : '✗'}
          </span>
        )}
      </div>
    )
  }

  // Card variant
  return (
    <div className={clsx(
      'rounded-xl border p-3 space-y-2',
      isLive && game.isClose
        ? 'border-brand-gold/40 bg-brand-gold/5'
        : isLive
        ? 'border-red-500/30 bg-red-500/5'
        : 'border-brand-border bg-brand-surface'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </span>
          )}
          {isFinal && (
            <span className="px-1.5 py-0.5 rounded-full bg-brand-surface border border-brand-border text-brand-muted font-medium text-xs">
              Final
            </span>
          )}
          {isLive && game.isClose && (
            <span className="text-brand-gold text-xs font-bold">🔥 Close Game!</span>
          )}
        </div>
        <span className="text-xs text-brand-muted">{game.clock}</span>
      </div>

      {/* Teams */}
      <div className="space-y-1">
        <CardTeamRow team={game.team1} userPickId={userPickTeamId} isFinal={isFinal} />
        <CardTeamRow team={game.team2} userPickId={userPickTeamId} isFinal={isFinal} />
      </div>
    </div>
  )
}

// ---

function TeamScore({
  team,
  userPickId,
}: {
  team: LiveGameScore['team1']
  userPickId?: string
}) {
  const isPick = userPickId && team.id === userPickId
  const color = isPick
    ? team.isWinning
      ? 'text-green-400'
      : 'text-red-400'
    : team.isWinning
    ? 'text-white'
    : 'text-brand-muted'

  return (
    <span className={clsx('transition-colors', color)}>
      {team.score}
    </span>
  )
}

function CardTeamRow({
  team,
  userPickId,
  isFinal,
}: {
  team: LiveGameScore['team1']
  userPickId?: string
  isFinal: boolean
}) {
  const isPick = !!(userPickId && team.id === userPickId)
  const pickColor = isPick
    ? team.isWinning
      ? 'text-green-400'
      : 'text-red-400'
    : ''

  return (
    <div className={clsx(
      'flex items-center justify-between px-2 py-1 rounded-lg',
      team.isWinning && isFinal
        ? 'bg-white/5'
        : 'bg-transparent'
    )}>
      <div className="flex items-center gap-2">
        {team.seed && (
          <span className="text-xs text-brand-muted w-4 text-right">{team.seed}</span>
        )}
        <span className={clsx(
          'text-sm font-semibold',
          isPick ? pickColor : team.isWinning ? 'text-white' : 'text-brand-muted'
        )}>
          {team.abbreviation}
        </span>
        {isPick && (
          <span className="text-xs">
            {team.isWinning ? '✅' : '❌'}
          </span>
        )}
      </div>
      <span className={clsx(
        'text-base font-black tabular-nums',
        isPick ? pickColor : team.isWinning ? 'text-white' : 'text-brand-muted'
      )}>
        {team.score}
      </span>
    </div>
  )
}
