'use client'

import { useState } from 'react'
import { Lock, Download, Loader2 } from 'lucide-react'

interface Props {
  poolId: string
  poolStatus: string
  leaderboard: Array<{
    display_name: string | null
    score: number
    bracket_name?: string
  }>
}

export default function CommissionerActions({ poolId, poolStatus, leaderboard }: Props) {
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const lockPicks = async () => {
    if (!window.confirm('Lock bracket picks for this pool? Members will no longer be able to edit their brackets.')) return
    setBusy('lock')
    try {
      const res = await fetch(`/api/pools/${poolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'locked' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast('Picks locked! Brackets are now frozen.')
      setTimeout(() => window.location.reload(), 1500)
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error')
    } finally {
      setBusy(null)
    }
  }

  const exportCsv = () => {
    const rows = [['Rank', 'Player', 'Score'].join(',')]
    leaderboard.forEach((entry, i) => {
      rows.push([
        String(i + 1),
        `"${(entry.display_name || 'Anonymous').replace(/"/g, '""')}"`,
        String(entry.score || 0),
      ].join(','))
    })
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pool-leaderboard-${poolId.slice(0, 8)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('CSV downloaded')
  }

  return (
    <div className="bg-brand-surface border border-amber-400/20 rounded-2xl p-5 space-y-4">
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

      <div className="flex items-center gap-2">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30">
          Commissioner
        </span>
        <h3 className="font-bold">Pool Actions</h3>
      </div>

      <div className="flex flex-wrap gap-3">
        {poolStatus !== 'locked' && poolStatus !== 'completed' && (
          <button
            onClick={lockPicks}
            disabled={!!busy}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-40 text-sm"
          >
            {busy === 'lock' ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            Lock Bracket Picks
          </button>
        )}
        {poolStatus === 'locked' && (
          <span className="flex items-center gap-2 text-sm text-amber-400 font-semibold px-4 py-2 bg-amber-400/10 rounded-xl border border-amber-400/20">
            <Lock size={14} />
            Picks are locked
          </span>
        )}
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 bg-brand-card hover:bg-brand-border border border-brand-border text-brand-muted hover:text-white font-semibold px-4 py-2 rounded-xl transition-all text-sm"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>
    </div>
  )
}
