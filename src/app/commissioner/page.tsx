'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trophy, Users, FileCheck, DollarSign, Share2, Settings, Plus, Loader2, Flag, Crosshair } from 'lucide-react'

interface League {
  id: string
  name: string
  status: string
  invite_code: string
  entry_fee: number | null
  bracket_type: string
  member_count: number
  submitted_count: number
  paid_count: number
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  open: 'bg-green-500/20 text-green-400 border-green-500/30',
  locked: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  active: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const COMING_SOON = [
  { name: 'Fantasy Football', icon: Crosshair },
  { name: 'Golf Pools', icon: Flag },
  { name: 'Survivor', icon: Trophy },
]

export default function CommissionerPage() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/commissioner/leagues')
      .then(r => r.json())
      .then(data => setLeagues(data.leagues || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const copyInvite = (pool: League) => {
    const url = `${window.location.origin}/join/${pool.invite_code}`
    navigator.clipboard.writeText(url)
    setCopiedId(pool.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-brand-orange" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">My Leagues</h1>
          <p className="text-brand-muted text-sm mt-1">Manage your pools and leagues</p>
        </div>
        <Link
          href="/pools/create"
          className="flex items-center gap-2 bg-brand-orange hover:bg-orange-400 text-black font-bold px-5 py-2.5 rounded-xl transition-all text-sm"
        >
          <Plus size={16} />
          Start a New League
        </Link>
      </div>

      {/* Leagues list */}
      {leagues.length === 0 ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-12 text-center">
          <Trophy size={48} className="mx-auto text-brand-muted mb-4" />
          <h2 className="text-lg font-bold mb-2">No leagues yet</h2>
          <p className="text-brand-muted text-sm mb-6">Create your first bracket pool and invite friends.</p>
          <Link
            href="/pools/create"
            className="inline-flex items-center gap-2 bg-brand-orange hover:bg-orange-400 text-black font-bold px-6 py-3 rounded-xl transition-all"
          >
            <Plus size={16} />
            Start a New League
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {leagues.map(league => {
            const entryFee = Number(league.entry_fee) || 0
            const submissionPct = league.member_count > 0
              ? Math.round((league.submitted_count / league.member_count) * 100)
              : 0
            const paidPct = league.member_count > 0
              ? Math.round((league.paid_count / league.member_count) * 100)
              : 0

            return (
              <div key={league.id} className="bg-brand-surface border border-brand-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{league.name}</h3>
                    <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[league.status] || STATUS_COLORS.draft}`}>
                      {league.status}
                    </span>
                  </div>
                  <div className="text-xs text-brand-muted">
                    {league.bracket_type}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-brand-card rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-brand-muted text-xs mb-1">
                      <Users size={12} /> Members
                    </div>
                    <div className="text-lg font-bold">{league.member_count}</div>
                  </div>
                  <div className="bg-brand-card rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-brand-muted text-xs mb-1">
                      <FileCheck size={12} /> Submitted
                    </div>
                    <div className="text-lg font-bold">{submissionPct}%</div>
                  </div>
                  {entryFee > 0 && (
                    <div className="bg-brand-card rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-brand-muted text-xs mb-1">
                        <DollarSign size={12} /> Paid
                      </div>
                      <div className="text-lg font-bold">{paidPct}%</div>
                    </div>
                  )}
                  {entryFee > 0 && (
                    <div className="bg-brand-card rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-brand-muted text-xs mb-1">
                        <DollarSign size={12} /> Entry Fee
                      </div>
                      <div className="text-lg font-bold">${entryFee}</div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/pools/${league.id}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-brand-card hover:bg-brand-border transition-colors"
                  >
                    View
                  </Link>
                  <Link
                    href={`/pools/${league.id}/manage`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-brand-card hover:bg-brand-border transition-colors"
                  >
                    <Settings size={14} /> Manage
                  </Link>
                  <button
                    onClick={() => copyInvite(league)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 transition-colors"
                  >
                    <Share2 size={14} />
                    {copiedId === league.id ? 'Copied!' : 'Share Invite'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Coming soon */}
      <div>
        <h2 className="font-bold text-lg mb-3">Coming Soon</h2>
        <div className="flex flex-wrap gap-3">
          {COMING_SOON.map(({ name, icon: Icon }) => (
            <div
              key={name}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-surface border border-brand-border text-brand-muted text-sm opacity-50 cursor-not-allowed"
            >
              <Icon size={16} />
              {name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
