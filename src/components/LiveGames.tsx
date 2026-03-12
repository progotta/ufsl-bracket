'use client'

import { useState } from 'react'
import { useLiveScores } from '@/hooks/useLiveScores'
import GameLiveScore from '@/components/bracket/GameLiveScore'
import { RefreshCw, ChevronDown, ChevronUp, Radio } from 'lucide-react'
import clsx from 'clsx'
import type { LiveGameScore } from '@/lib/liveScores'

interface LiveGamesProps {
  /** Team IDs the current user has picked (for color coding) */
  userPickIds?: string[]
  /** Show collapsed by default */
  defaultCollapsed?: boolean
}

/**
 * "Games Now" dashboard widget.
 * Shows all currently playing games with live scores.
 * Auto-polls at 30s interval while games are active.
 */
export default function LiveGames({ userPickIds = [], defaultCollapsed = false }: LiveGamesProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [expandedGame, setExpandedGame] = useState<string | null>(null)

  const pickIdSet = new Set(userPickIds)

  const { games, activeGames, loading, error, source, lastUpdated, hasActiveGames, refetch } =
    useLiveScores()

  // Show widget only if there are games happening (or completed today)
  const displayGames = [...activeGames, ...games.filter(g => g.status === 'completed')].slice(0, 20)
  const scheduledGames = games.filter(g => g.status === 'scheduled').slice(0, 6)

  // Completely hide if nothing to show and not loading
  if (!loading && displayGames.length === 0 && scheduledGames.length === 0) {
    return null
  }

  return (
    <section className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
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
            onClick={(e) => { e.stopPropagation(); refetch() }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-brand-muted hover:text-white transition-colors"
            title="Refresh scores"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          {collapsed ? <ChevronDown size={16} className="text-brand-muted" /> : <ChevronUp size={16} className="text-brand-muted" />}
        </div>
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          {loading && displayGames.length === 0 && (
            <div className="flex items-center justify-center py-6 text-brand-muted text-sm gap-2">
              <RefreshCw size={14} className="animate-spin" />
              Loading scores...
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">
              ⚠ Couldn&apos;t load scores. {error}
            </div>
          )}

          {/* Active + Completed games */}
          {displayGames.length > 0 && (
            <div className="space-y-2">
              {displayGames.map(game => (
                <GameRow
                  key={game.id}
                  game={game}
                  userPickIds={pickIdSet}
                  expanded={expandedGame === game.id}
                  onToggle={() => setExpandedGame(expandedGame === game.id ? null : game.id)}
                />
              ))}
            </div>
          )}

          {/* Upcoming games */}
          {scheduledGames.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-brand-muted uppercase tracking-wide mb-2 mt-3">
                Upcoming
              </h4>
              <div className="space-y-1">
                {scheduledGames.map(game => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between text-sm text-brand-muted px-2 py-1.5"
                  >
                    <span>
                      {game.team1.seed ? `(${game.team1.seed}) ` : ''}{game.team1.abbreviation}
                      {' vs '}
                      {game.team2.seed ? `(${game.team2.seed}) ` : ''}{game.team2.abbreviation}
                    </span>
                    <span className="text-xs">{game.clock}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && displayGames.length === 0 && scheduledGames.length === 0 && (
            <div className="text-center py-4 text-brand-muted text-sm">
              No games scheduled right now 🏀
            </div>
          )}
        </div>
      )}
    </section>
  )
}

// ---

function GameRow({
  game,
  userPickIds,
  expanded,
  onToggle,
}: {
  game: LiveGameScore
  userPickIds: Set<string>
  expanded: boolean
  onToggle: () => void
}) {
  const pickTeam =
    (game.team1.id && userPickIds.has(game.team1.id) ? game.team1 : null) ??
    (game.team2.id && userPickIds.has(game.team2.id) ? game.team2 : null)

  const pickIsWinning = pickTeam?.isWinning

  return (
    <div
      className={clsx(
        'rounded-xl border transition-all cursor-pointer',
        game.status === 'in_progress' || game.status === 'halftime'
          ? 'border-red-500/25 hover:border-red-500/40'
          : 'border-brand-border hover:border-brand-border/70',
        game.isClose && 'border-brand-gold/30 hover:border-brand-gold/50'
      )}
      onClick={onToggle}
    >
      {/* Compact row */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <GameLiveScore
          game={game}
          userPickTeamId={pickTeam?.id}
          variant="compact"
        />
        <ChevronDown
          size={14}
          className={clsx(
            'text-brand-muted shrink-0 transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </div>

      {/* Expanded card view */}
      {expanded && (
        <div className="px-3 pb-3">
          <GameLiveScore
            game={game}
            userPickTeamId={pickTeam?.id}
            variant="card"
          />
          {pickTeam && (
            <div className={clsx(
              'mt-2 text-xs text-center font-medium',
              pickIsWinning ? 'text-green-400' : 'text-red-400'
            )}>
              {pickIsWinning
                ? `✅ Your pick (${pickTeam.name}) is winning`
                : `❌ Your pick (${pickTeam.name}) is losing`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
