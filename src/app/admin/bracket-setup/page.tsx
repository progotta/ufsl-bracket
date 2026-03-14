'use client'

import { useState, useEffect, useCallback } from 'react'
import { Upload, Trash2, Play, RefreshCw, Loader2, CheckCircle, AlertTriangle, Plus } from 'lucide-react'

interface Team {
  id: string
  name: string
  abbreviation: string
  seed: number
  region: string
  espn_id: number | null
  season: number
}

interface GameRow {
  id: string
  round: number
  game_number: number
  region: string | null
  team1_id: string | null
  team2_id: string | null
  status: string
}

const REGIONS = ['East', 'West', 'South', 'Midwest']
const SEASON = 2026

export default function BracketSetupPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [games, setGames] = useState<GameRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Single team form
  const [name, setName] = useState('')
  const [abbreviation, setAbbreviation] = useState('')
  const [seed, setSeed] = useState('')
  const [region, setRegion] = useState('East')
  const [espnId, setEspnId] = useState('')

  // Bulk paste
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkText, setBulkText] = useState('')

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/bracket-setup?season=${SEASON}`)
      const data = await res.json()
      setTeams(data.teams || [])
      setGames(data.games || [])
    } catch {
      showToast('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchData() }, [fetchData])

  const addTeam = async () => {
    if (!name || !abbreviation || !seed) {
      showToast('Name, abbreviation, and seed are required', 'error')
      return
    }
    setBusy('add')
    try {
      const res = await fetch('/api/admin/bracket-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import_teams',
          data: {
            season: SEASON,
            teams: [{
              name,
              abbreviation,
              seed: parseInt(seed),
              region,
              espn_id: espnId ? parseInt(espnId) : undefined,
            }],
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast('Team added')
      setName(''); setAbbreviation(''); setSeed(''); setEspnId('')
      await fetchData()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error')
    } finally {
      setBusy(null)
    }
  }

  const bulkImport = async () => {
    const lines = bulkText.trim().split('\n').filter(Boolean)
    const parsed = lines.map(line => {
      const parts = line.split(/[\t,]/).map(s => s.trim())
      if (parts.length < 4) return null
      return {
        name: parts[0],
        abbreviation: parts[1],
        seed: parseInt(parts[2]),
        region: parts[3],
        espn_id: parts[4] ? parseInt(parts[4]) : undefined,
      }
    }).filter(Boolean) as Array<{ name: string; abbreviation: string; seed: number; region: string; espn_id?: number }>

    if (parsed.length === 0) {
      showToast('No valid rows found. Format: Name, Abbrev, Seed, Region [, ESPN ID]', 'error')
      return
    }

    setBusy('bulk')
    try {
      const res = await fetch('/api/admin/bracket-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import_teams', data: { season: SEASON, teams: parsed } }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast(`Imported ${data.count} teams`)
      setBulkText('')
      await fetchData()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error')
    } finally {
      setBusy(null)
    }
  }

  const deleteTeam = async (teamId: string) => {
    if (!window.confirm('Delete this team?')) return
    setBusy(`del-${teamId}`)
    try {
      const res = await fetch('/api/admin/bracket-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_team', data: { teamId } }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast('Team deleted')
      await fetchData()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error')
    } finally {
      setBusy(null)
    }
  }

  const generateGames = async () => {
    if (teams.length !== 64) {
      showToast(`Need 64 teams, have ${teams.length}`, 'error')
      return
    }
    if (!window.confirm('Generate 63 games from current teams? This will replace any existing games for 2026.')) return
    setBusy('generate')
    try {
      const res = await fetch('/api/admin/bracket-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_games', data: { season: SEASON } }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast(`Generated ${data.gamesCreated} games!`)
      await fetchData()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error')
    } finally {
      setBusy(null)
    }
  }

  const resetSeason = async () => {
    if (!window.confirm(`Delete ALL teams and games for season ${SEASON}? This cannot be undone.`)) return
    setBusy('reset')
    try {
      const res = await fetch('/api/admin/bracket-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_season', data: { season: SEASON } }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast('Season reset')
      await fetchData()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error')
    } finally {
      setBusy(null)
    }
  }

  // Region team counts
  const regionCounts = REGIONS.map(r => ({
    region: r,
    count: teams.filter(t => t.region === r).length,
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-amber-400" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg ${
          toast.type === 'error'
            ? 'bg-red-900/80 border-red-500/40 text-red-300'
            : 'bg-green-900/80 border-green-500/40 text-green-300'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">2026 Bracket Setup</h1>
          <p className="text-brand-muted text-sm mt-1">Enter 64 teams then generate the bracket games</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className={`font-bold ${teams.length === 64 ? 'text-green-400' : 'text-amber-400'}`}>
            {teams.length}/64 teams
          </span>
          {teams.length === 64 && <CheckCircle size={16} className="text-green-400" />}
        </div>
      </div>

      {/* Region status */}
      <div className="grid grid-cols-4 gap-3">
        {regionCounts.map(({ region: r, count }) => (
          <div key={r} className={`bg-brand-card rounded-xl p-3 border ${count === 16 ? 'border-green-500/30' : 'border-brand-border'}`}>
            <div className="text-xs text-brand-muted font-semibold uppercase">{r}</div>
            <div className={`text-lg font-black ${count === 16 ? 'text-green-400' : 'text-amber-400'}`}>
              {count}/16
            </div>
          </div>
        ))}
      </div>

      {/* Team Entry */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Add Teams</h2>
          <button
            onClick={() => setBulkMode(!bulkMode)}
            className="text-xs text-amber-400 hover:underline flex items-center gap-1"
          >
            <Upload size={12} />
            {bulkMode ? 'Single Entry' : 'Bulk Paste'}
          </button>
        </div>

        {bulkMode ? (
          <div className="space-y-3">
            <p className="text-xs text-brand-muted">
              Paste tab-separated or comma-separated rows: <code className="text-amber-400/80">Name, Abbreviation, Seed, Region [, ESPN ID]</code>
            </p>
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder="Duke, DUKE, 1, East&#10;Houston, HOU, 1, South&#10;..."
              rows={10}
              className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-amber-400/50 font-mono"
            />
            <button
              onClick={bulkImport}
              disabled={!!busy || !bulkText.trim()}
              className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-40 text-sm"
            >
              {busy === 'bulk' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Import Teams
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Team Name"
                className="bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-amber-400/50"
              />
              <input
                value={abbreviation}
                onChange={e => setAbbreviation(e.target.value.toUpperCase())}
                placeholder="ABBR"
                maxLength={6}
                className="bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-amber-400/50"
              />
              <input
                type="number"
                value={seed}
                onChange={e => setSeed(e.target.value)}
                placeholder="Seed"
                min={1}
                max={16}
                className="bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-amber-400/50"
              />
              <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50"
              >
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <input
                value={espnId}
                onChange={e => setEspnId(e.target.value)}
                placeholder="ESPN ID"
                className="bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-amber-400/50"
              />
            </div>
            <button
              onClick={addTeam}
              disabled={!!busy || !name || !abbreviation || !seed}
              className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-40 text-sm"
            >
              {busy === 'add' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add Team
            </button>
          </div>
        )}
      </div>

      {/* Teams Table */}
      {teams.length > 0 && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-brand-border flex items-center justify-between">
            <h2 className="font-bold">Teams ({teams.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-brand-muted text-xs uppercase border-b border-brand-border">
                  <th className="px-4 py-2 text-left">Region</th>
                  <th className="px-4 py-2 text-left">Seed</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Abbr</th>
                  <th className="px-4 py-2 text-left">ESPN ID</th>
                  <th className="px-4 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {teams.map(team => (
                  <tr key={team.id} className="border-b border-brand-border/50 hover:bg-brand-card/30">
                    <td className="px-4 py-2 text-brand-muted">{team.region}</td>
                    <td className="px-4 py-2">
                      <span className="bg-brand-border px-1.5 py-0.5 rounded text-xs font-mono">{team.seed}</span>
                    </td>
                    <td className="px-4 py-2 font-medium">{team.name}</td>
                    <td className="px-4 py-2 text-brand-muted">{team.abbreviation}</td>
                    <td className="px-4 py-2 text-brand-muted">{team.espn_id || '—'}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => deleteTeam(team.id)}
                        disabled={busy === `del-${team.id}`}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        {busy === `del-${team.id}` ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-lg">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={generateGames}
            disabled={!!busy || teams.length !== 64}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-40 text-sm"
          >
            {busy === 'generate' ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Generate Games from Teams
          </button>
          <button
            onClick={resetSeason}
            disabled={!!busy}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-40 text-sm"
          >
            {busy === 'reset' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Reset Season {SEASON}
          </button>
        </div>
        {teams.length !== 64 && teams.length > 0 && (
          <p className="text-xs text-amber-400 flex items-center gap-1">
            <AlertTriangle size={12} />
            Need exactly 64 teams (16 per region) before generating games
          </p>
        )}
      </div>

      {/* Games status */}
      {games.length > 0 && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
          <h2 className="font-bold text-lg mb-3">Generated Games</h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-400 font-semibold">{games.length} games created</span>
            <span className="text-brand-muted">
              R1: {games.filter(g => g.round === 1).length} |
              R2: {games.filter(g => g.round === 2).length} |
              R3: {games.filter(g => g.round === 3).length} |
              R4: {games.filter(g => g.round === 4).length} |
              R5: {games.filter(g => g.round === 5).length} |
              R6: {games.filter(g => g.round === 6).length}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
