'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'

import { ROUND_NAMES } from '@/lib/bracket'
import {
  Activity, Play, SkipForward, RefreshCw, Zap, Calendar,
  Clock, ChevronDown, ChevronUp, CheckCircle, Circle, Loader2,
  AlertTriangle, Trophy, Settings
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SimConfig {
  id: string
  is_simulation_mode: boolean
  time_multiplier: number
  current_simulated_date: string | null
}

interface GameTeam {
  id: string
  name: string
  abbreviation: string
  seed: number
  region: string
}

interface Game {
  id: string
  round: number
  game_number: number
  region: string | null
  status: string
  team1: GameTeam | null
  team2: GameTeam | null
  winner: GameTeam | null
  team1_score: number | null
  team2_score: number | null
}

// ─── Helper components ────────────────────────────────────────────────────────

function AdminBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30">
      ⚡ ADMIN
    </span>
  )
}

function StatusPill({ status, gamesComplete, gamesTotal }: { status: string; gamesComplete: number; gamesTotal: number }) {
  const pct = gamesTotal > 0 ? Math.round((gamesComplete / gamesTotal) * 100) : 0
  const color = pct === 100 ? 'text-green-400 border-green-400/30 bg-green-400/10'
    : pct > 0 ? 'text-amber-400 border-amber-400/30 bg-amber-400/10'
    : 'text-brand-muted border-brand-border bg-brand-card'
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${color}`}>
      {pct === 100 ? <CheckCircle size={11} /> : <Circle size={11} />}
      {gamesComplete}/{gamesTotal} games
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SimulatorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-amber-400" />
      </div>
    }>
      <SimulatorContent />
    </Suspense>
  )
}

function SimulatorContent() {
  const [config, setConfig] = useState<SimConfig | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [expandedRounds, setExpandedRounds] = useState<number[]>([1])
  const [selectedGame, setSelectedGame] = useState<string>('')
  const [timeMultiplierInput, setTimeMultiplierInput] = useState<string>('144')

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/simulator')
      const data = await res.json()
      if (!res.ok) {
        showToast(`Failed to load: ${data.error || res.status}`, 'error')
        return
      }
      setConfig(data.config)
      setGames(data.games || [])
      if (data.config?.time_multiplier) {
        setTimeMultiplierInput(String(data.config.time_multiplier))
      }
    } catch (e) {
      showToast(`Failed to load: ${e instanceof Error ? e.message : String(e)}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchData() }, [fetchData])

  // ── API helpers ──────────────────────────────────────────────

  const patch = async (body: object, label: string) => {
    setBusy(label)
    try {
      const res = await fetch('/api/admin/simulator', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await fetchData()
      showToast('Updated ✓')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error')
    } finally {
      setBusy(null)
    }
  }

  const post = async (url: string, body: object, label: string, successMsg: string) => {
    setBusy(label)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await fetchData()
      showToast(successMsg)
      return data
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error')
    } finally {
      setBusy(null)
    }
  }

  // ── Derived data ─────────────────────────────────────────────

  const roundGroups: Record<number, Game[]> = {}
  games.forEach(g => {
    if (!roundGroups[g.round]) roundGroups[g.round] = []
    roundGroups[g.round].push(g)
  })

  const nextUnplayedRound = (() => {
    for (let r = 1; r <= 6; r++) {
      if (!roundGroups[r]) continue
      if (roundGroups[r].some(g => g.status !== 'completed')) return r
    }
    return null
  })()

  const pendingGames = games.filter(g =>
    g.status !== 'completed' && g.team1 && g.team2
  )
  const completedCount = games.filter(g => g.status === 'completed').length
  const totalGames = games.length

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-amber-400" />
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg animate-fade-in ${
          toast.type === 'error'
            ? 'bg-red-900/80 border-red-500/40 text-red-300'
            : 'bg-green-900/80 border-green-500/40 text-green-300'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <AdminBadge />
              <h1 className="text-3xl font-black tracking-tight">Tournament Simulator</h1>
            </div>
            <p className="text-brand-muted text-sm">Control tournament simulation for UFSL Bracket test environment</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <StatusPill status="progress" gamesComplete={completedCount} gamesTotal={totalGames} />
            {nextUnplayedRound && (
              <span className="text-brand-muted">Next: R{nextUnplayedRound} {ROUND_NAMES[nextUnplayedRound]}</span>
            )}
            {!nextUnplayedRound && completedCount > 0 && (
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <Trophy size={14} /> Tournament Complete
              </span>
            )}
          </div>
        </div>

        {/* ── Sim Controls ── */}
        <div className="bg-brand-surface border border-amber-400/20 rounded-2xl p-5 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Settings size={16} className="text-amber-400" />
            <h2 className="font-bold text-lg">Simulation Controls</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Sim Mode Toggle */}
            <div className="bg-brand-card rounded-xl p-4 flex flex-col gap-3">
              <span className="text-xs text-brand-muted font-semibold uppercase tracking-wide">Sim Mode</span>
              <button
                onClick={() => patch({ is_simulation_mode: !config?.is_simulation_mode }, 'toggle')}
                disabled={busy === 'toggle'}
                className={`relative w-14 h-7 rounded-full transition-all flex-shrink-0 ${
                  config?.is_simulation_mode ? 'bg-amber-400' : 'bg-brand-border'
                }`}
              >
                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${
                  config?.is_simulation_mode ? 'left-8' : 'left-1'
                }`} />
              </button>
              <span className={`text-sm font-semibold ${config?.is_simulation_mode ? 'text-amber-400' : 'text-brand-muted'}`}>
                {config?.is_simulation_mode ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* Time Multiplier */}
            <div className="bg-brand-card rounded-xl p-4 flex flex-col gap-3">
              <span className="text-xs text-brand-muted font-semibold uppercase tracking-wide">Time Multiplier</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={timeMultiplierInput}
                  onChange={e => setTimeMultiplierInput(e.target.value)}
                  className="w-20 bg-brand-border rounded-lg px-3 py-1.5 text-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-400"
                  min={1}
                  max={10000}
                />
                <span className="text-brand-muted text-xs">×</span>
                <button
                  onClick={() => patch({ time_multiplier: parseInt(timeMultiplierInput) || 144 }, 'multiplier')}
                  disabled={busy === 'multiplier'}
                  className="text-xs bg-amber-400/20 hover:bg-amber-400/30 text-amber-400 px-2.5 py-1.5 rounded-lg transition-all font-medium"
                >
                  Set
                </button>
              </div>
              <span className="text-xs text-brand-muted">
                {config?.time_multiplier}x = 10 min → {Math.round((config?.time_multiplier || 144) / 144 * 24)}h game time
              </span>
            </div>

            {/* Simulated Date */}
            <div className="bg-brand-card rounded-xl p-4 flex flex-col gap-3">
              <span className="text-xs text-brand-muted font-semibold uppercase tracking-wide">Simulated Date</span>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-amber-400 flex-shrink-0" />
                <span className="text-sm font-mono font-semibold">
                  {config?.current_simulated_date
                    ? new Date(config.current_simulated_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
                    : '—'}
                </span>
              </div>
              <button
                onClick={() => post('/api/admin/simulator/advance-day', {}, 'advance', 'Advanced 1 day ✓')}
                disabled={!!busy}
                className="flex items-center gap-1.5 text-xs bg-amber-400/20 hover:bg-amber-400/30 text-amber-400 px-3 py-1.5 rounded-lg transition-all font-medium w-fit"
              >
                {busy === 'advance' ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
                Advance 1 Day
              </button>
            </div>
          </div>
        </div>

        {/* ── Round Controls ── */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-amber-400" />
            <h2 className="font-bold text-lg">Round Controls</h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => post('/api/admin/simulator/play-round', { useActual: true }, 'play-round',
                nextUnplayedRound ? `Round ${nextUnplayedRound} complete ✓` : 'No rounds to play'
              )}
              disabled={!!busy || !nextUnplayedRound}
              className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {busy === 'play-round' ? <Loader2 size={15} className="animate-spin" /> : <SkipForward size={15} />}
              Play Next Round
              {nextUnplayedRound && <span className="bg-black/20 rounded-md px-1.5 py-0.5 text-xs">R{nextUnplayedRound}</span>}
            </button>

            <button
              onClick={() => post('/api/admin/simulator/play-round', { useActual: false }, 'play-round-rand',
                nextUnplayedRound ? `Round ${nextUnplayedRound} complete ✓` : 'No rounds to play'
              )}
              disabled={!!busy || !nextUnplayedRound}
              className="flex items-center gap-2 bg-brand-card hover:bg-brand-border border border-brand-border text-brand-muted hover:text-white font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {busy === 'play-round-rand' ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
              Random Round
            </button>
          </div>

          {/* Play Single Game */}
          {pendingGames.length > 0 && (
            <div className="bg-brand-card rounded-xl p-4 space-y-3">
              <span className="text-xs text-brand-muted font-semibold uppercase tracking-wide">Play Single Game</span>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedGame}
                  onChange={e => setSelectedGame(e.target.value)}
                  className="flex-1 bg-brand-border border border-brand-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  <option value="">Select a game...</option>
                  {pendingGames.map(g => (
                    <option key={g.id} value={g.id}>
                      R{g.round} G{g.game_number} • {g.region} • {g.team1?.abbreviation} vs {g.team2?.abbreviation}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => selectedGame && post('/api/admin/simulator/play-game', { gameId: selectedGame, useActual: true }, 'play-game', 'Game simulated ✓')}
                  disabled={!!busy || !selectedGame}
                  className="flex items-center justify-center gap-2 bg-amber-400/20 hover:bg-amber-400/30 text-amber-400 font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                >
                  {busy === 'play-game' ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  Play Game
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Quick Actions ── */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-amber-400" />
            <h2 className="font-bold text-lg">Quick Actions</h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                if (window.confirm('Reset ALL game results? This cannot be undone.')) {
                  post('/api/admin/simulator/reset', {}, 'reset', 'Tournament reset ✓')
                }
              }}
              disabled={!!busy}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {busy === 'reset' ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              Reset Tournament
            </button>

            <button
              onClick={() => {
                if (window.confirm('Auto-simulate entire tournament with actual 2025 results?')) {
                  post('/api/admin/simulator/auto-sim', {}, 'auto-sim', '🏆 Auto-sim complete! 2025 results applied.')
                }
              }}
              disabled={!!busy}
              className="flex items-center gap-2 bg-brand-gradient text-white font-bold px-5 py-2.5 rounded-xl transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {busy === 'auto-sim' ? <Loader2 size={15} className="animate-spin" /> : <Trophy size={15} />}
              Auto-Sim All (2025 Results)
            </button>
          </div>

          <p className="text-xs text-brand-muted">
            <strong className="text-amber-400/70">Auto-Sim</strong> applies actual 2025 NCAA Tournament results (Duke wins championship).
            {' '}<strong className="text-amber-400/70">Play Next Round</strong> uses 2025 results round-by-round.
            {' '}<strong className="text-amber-400/70">Random Round</strong> uses seed-weighted random outcomes.
          </p>
        </div>

        {/* ── Game Results by Round ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-amber-400" />
            <h2 className="font-bold text-lg">Game Results</h2>
          </div>

          {Object.entries(roundGroups).map(([round, roundGames]) => {
            const r = parseInt(round)
            const doneCount = roundGames.filter(g => g.status === 'completed').length
            const isExpanded = expandedRounds.includes(r)
            return (
              <div key={round} className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedRounds(prev =>
                    prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
                  )}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-brand-card/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-amber-400 text-black text-xs px-2 py-0.5 rounded-full font-black">R{round}</span>
                    <span className="font-semibold">{ROUND_NAMES[r]}</span>
                    <StatusPill status="" gamesComplete={doneCount} gamesTotal={roundGames.length} />
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-brand-muted" /> : <ChevronDown size={16} className="text-brand-muted" />}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 space-y-2">
                    {roundGames.map(game => (
                      <GameRow key={game.id} game={game} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── GameRow ──────────────────────────────────────────────────────────────────

function GameRow({ game }: { game: Game }) {
  const isDone = game.status === 'completed'

  if (!game.team1 || !game.team2) {
    return (
      <div className="bg-brand-card rounded-xl px-4 py-3 text-brand-muted text-sm flex items-center gap-2">
        <Circle size={12} className="text-brand-border" />
        Game {game.game_number} — Teams TBD
      </div>
    )
  }

  return (
    <div className={`rounded-xl px-4 py-3 flex items-center gap-3 text-sm transition-all ${
      isDone ? 'bg-brand-card/50 border border-brand-border/50' : 'bg-brand-card border border-amber-400/10'
    }`}>
      <div className="text-brand-muted text-xs w-12 flex-shrink-0">
        G{game.game_number}
        {game.region && <div className="text-[10px]">{game.region.substring(0, 4)}</div>}
      </div>

      {/* Team 1 */}
      <div className={`flex items-center gap-1.5 flex-1 px-2.5 py-1.5 rounded-lg ${
        game.winner?.id === game.team1.id
          ? 'bg-amber-400/15 border border-amber-400/30'
          : isDone ? 'opacity-40' : ''
      }`}>
        <span className="text-[10px] bg-brand-border px-1 rounded font-mono">{game.team1.seed}</span>
        <span className="font-medium truncate">{game.team1.abbreviation}</span>
        {isDone && game.team1_score !== null && (
          <span className={`ml-auto font-bold tabular-nums ${game.winner?.id === game.team1.id ? 'text-amber-400' : 'text-brand-muted'}`}>
            {game.team1_score}
          </span>
        )}
        {game.winner?.id === game.team1.id && <CheckCircle size={12} className="text-amber-400 flex-shrink-0" />}
      </div>

      <span className="text-brand-border text-xs">vs</span>

      {/* Team 2 */}
      <div className={`flex items-center gap-1.5 flex-1 px-2.5 py-1.5 rounded-lg ${
        game.winner?.id === game.team2.id
          ? 'bg-amber-400/15 border border-amber-400/30'
          : isDone ? 'opacity-40' : ''
      }`}>
        <span className="text-[10px] bg-brand-border px-1 rounded font-mono">{game.team2.seed}</span>
        <span className="font-medium truncate">{game.team2.abbreviation}</span>
        {isDone && game.team2_score !== null && (
          <span className={`ml-auto font-bold tabular-nums ${game.winner?.id === game.team2.id ? 'text-amber-400' : 'text-brand-muted'}`}>
            {game.team2_score}
          </span>
        )}
        {game.winner?.id === game.team2.id && <CheckCircle size={12} className="text-amber-400 flex-shrink-0" />}
      </div>

      {/* Status */}
      <div className="w-16 flex-shrink-0 text-right">
        {isDone ? (
          <span className="text-xs text-green-400 font-medium">Final</span>
        ) : (
          <span className="text-xs text-amber-400/60 font-medium">Pending</span>
        )}
      </div>
    </div>
  )
}
