'use client'

import { useLiveScores } from '@/hooks/useLiveScores'
import { RefreshCw, Radio } from 'lucide-react'
import clsx from 'clsx'
import type { LiveGameScore } from '@/lib/liveScores'
import TeamLogo from '@/components/ui/TeamLogo'

interface LiveGamesProps {
  /** Team IDs the current user has picked (for color coding) */
  userPickIds?: string[]
}

/**
 * "Games Now" dashboard widget.
 * Shows all games as always-visible mini box score cards.
 * Auto-polls at 30s interval while games are active.
 */
export default function LiveGames({ userPickIds = [] }: LiveGamesProps) {
  const pickIdSet = new Set(userPickIds)

  const { games, activeGames, loading, error, source, lastUpdated, hasActiveGames, refetch } =
    useLiveScores()

  const displayGames = [...activeGames, ...games.filter(g => g.status === 'completed')].slice(0, 20)
  const scheduledGames = games.filter(g => g.status === 'scheduled').slice(0, 6)

  if (!loading && displayGames.length === 0 && scheduledGames.length === 0) {
    return null
  }

  return (
    <section className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={clsx(
            'flex items-center gap-2 font-bold',
            hasActiveGames ? 'text-red-400' : 'text-white'
          )}>
            {hasActiveGames && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
            )}
            {!hasActiveGames && <Radio size={16} className="text-brand-muted" />}
            {hasActiveGames ? 'Games Now' : 'Scores'}
          </div>

          {hasActiveGames && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 font-medium">
              {activeGames.length} Live
            </span>
          )}

          {source && (
            <span className="text-xs text-brand-muted">
              via {source === 'espn' ? 'ESPN' : source === 'database' ? 'Sim' : 'DB'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-brand-muted hidden sm:block">
              Updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => refetch()}
            className="p-1.5 rounded-lg hover:bg-white/10 text-brand-muted hover:text-white transition-colors"
            title="Refresh scores"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-4">
        {loading && displayGames.length === 0 && scheduledGames.length === 0 && (
          <div className="flex items-center justify-center py-6 text-brand-muted text-sm gap-2">
            <RefreshCw size={14} className="animate-spin" />
            Loading scores...
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2 mb-3">
            Could not load scores. {error}
          </div>
        )}

        {/* Game cards grid */}
        {(displayGames.length > 0 || scheduledGames.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {displayGames.map(game => (
              <GameCard key={game.id} game={game} userPickIds={pickIdSet} />
            ))}
            {scheduledGames.map(game => (
              <GameCard key={game.id} game={game} userPickIds={pickIdSet} />
            ))}
          </div>
        )}

        {!loading && displayGames.length === 0 && scheduledGames.length === 0 && (
          <div className="text-center py-4 text-brand-muted text-sm">
            No games scheduled right now
          </div>
        )}
      </div>
    </section>
  )
}

// ---

function GameCard({
  game,
  userPickIds,
}: {
  game: LiveGameScore
  userPickIds: Set<string>
}) {
  const isLive = game.status === 'in_progress' || game.status === 'halftime'
  const isFinal = game.status === 'completed'
  const isScheduled = game.status === 'scheduled'

  return (
    <div
      className={clsx(
        'rounded-xl border p-3 transition-all',
        isLive && game.isClose
          ? 'border-brand-gold/40 bg-brand-gold/5'
          : isLive
          ? 'border-red-500/30 bg-red-500/5 shadow-[0_0_12px_rgba(239,68,68,0.1)]'
          : 'border-brand-border bg-brand-surface'
      )}
    >
      {/* Status badge */}
      <div className="flex items-center justify-between mb-2">
        {isLive && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </span>
        )}
        {isFinal && (
          <span className="px-1.5 py-0.5 rounded-full bg-white/5 border border-brand-border text-brand-muted font-medium text-xs">
            Final
          </span>
        )}
        {isScheduled && (
          <span className="px-1.5 py-0.5 rounded-full bg-white/5 border border-brand-border text-brand-muted font-medium text-xs">
            Scheduled
          </span>
        )}
        {isLive && game.isClose && (
          <span className="text-brand-gold text-xs font-bold">Close Game</span>
        )}
        <span className="text-xs text-brand-muted ml-auto">{game.clock}</span>
      </div>

      {/* Team rows */}
      <div className="space-y-1">
        <TeamRow team={game.team1} userPickIds={userPickIds} isFinal={isFinal} isScheduled={isScheduled} />
        <TeamRow team={game.team2} userPickIds={userPickIds} isFinal={isFinal} isScheduled={isScheduled} />
      </div>
    </div>
  )
}

function TeamRow({
  team,
  userPickIds,
  isFinal,
  isScheduled,
}: {
  team: LiveGameScore['team1']
  userPickIds: Set<string>
  isFinal: boolean
  isScheduled: boolean
}) {
  const isPick = !!(team.id && userPickIds.has(team.id))
  const isWinning = team.isWinning
  const isLoser = isFinal && !isWinning

  return (
    <div className={clsx(
      'flex items-center justify-between px-2 py-1.5 rounded-lg',
      isWinning && isFinal && 'bg-white/5',
    )}>
      <div className="flex items-center gap-2 min-w-0">
        <TeamLogo espnId={team.espnTeamId} teamName={team.name} size="sm" />
        {team.seed && (
          <span className="text-[10px] text-brand-muted w-3 text-right flex-shrink-0">{team.seed}</span>
        )}
        <span className={clsx(
          'text-sm truncate',
          isLoser ? 'text-brand-muted' : 'text-white',
          isWinning && 'font-bold',
          isPick && isWinning && 'text-green-400',
          isPick && !isWinning && !isScheduled && 'text-red-400',
        )}>
          {team.name}
        </span>
      </div>
      <span className={clsx(
        'text-base font-black tabular-nums flex-shrink-0 ml-2',
        isScheduled ? 'text-brand-muted' : '',
        !isScheduled && isLoser ? 'text-brand-muted' : '',
        !isScheduled && isWinning ? 'text-white' : '',
        isPick && isWinning && 'text-green-400',
        isPick && !isWinning && !isScheduled && 'text-red-400',
      )}>
        {isScheduled ? '-' : team.score}
      </span>
    </div>
  )
}
