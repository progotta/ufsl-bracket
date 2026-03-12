'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Users, Clock } from 'lucide-react'
import type { Pool } from '@/types/database'
import { BRACKET_TYPE_META, type BracketType } from '@/lib/secondChance'

interface JoinPoolFormProps {
  pool: Pool & { join_requires_approval?: boolean; max_members?: number | null }
  userId: string
  memberCount?: number
  commissioner?: { display_name: string | null } | null
  bracketMeta?: (typeof BRACKET_TYPE_META)[keyof typeof BRACKET_TYPE_META]
}

export default function JoinPoolForm({ pool, userId, memberCount = 0, commissioner, bracketMeta }: JoinPoolFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingApproval, setPendingApproval] = useState(false)
  const router = useRouter()

  const meta = bracketMeta || BRACKET_TYPE_META[(pool.bracket_type || 'full') as BracketType]

  const handleJoin = async () => {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/pools/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: pool.invite_code }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setLoading(false)
      return
    }

    if (data.alreadyMember) {
      router.push(`/pools/${pool.id}`)
      return
    }

    if (data.requiresApproval) {
      setPendingApproval(true)
      setLoading(false)
      return
    }

    router.push(`/pools/${pool.id}`)
  }

  if (pendingApproval) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 text-center">
        <div className="bg-yellow-500/10 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <Clock size={30} className="text-yellow-400" />
        </div>
        <h1 className="text-2xl font-black mb-2">Request Sent!</h1>
        <p className="text-brand-muted mb-4">
          The pool commissioner will review your request to join <strong className="text-white">{pool.name}</strong>.
          You&apos;ll be notified when you&apos;re approved.
        </p>
        <a href="/dashboard" className="btn-secondary inline-block">Back to Dashboard</a>
      </div>
    )
  }

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 text-center">
      <div className="bg-brand-orange/10 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
        <Users size={30} className="text-brand-orange" />
      </div>
      <div className="text-brand-muted text-sm mb-1">You&apos;re invited to join</div>
      <h1 className="text-2xl font-black mb-2">{pool.name}</h1>
      {pool.description && (
        <p className="text-brand-muted mb-4 text-sm">{pool.description}</p>
      )}

      <div className="grid grid-cols-3 gap-3 my-5">
        <div className="bg-brand-card rounded-xl p-3">
          <div className="text-xl font-black text-brand-orange">{memberCount}</div>
          <div className="text-xs text-brand-muted">Members</div>
        </div>
        <div className="bg-brand-card rounded-xl p-3">
          <div className="text-lg">{meta.emoji}</div>
          <div className="text-xs text-brand-muted">{meta.shortLabel || 'Full'}</div>
        </div>
        <div className="bg-brand-card rounded-xl p-3">
          <StatusBadge status={pool.status} />
        </div>
      </div>

      {commissioner?.display_name && (
        <p className="text-xs text-brand-muted mb-5">
          Commissioner: <span className="text-white font-medium">{commissioner.display_name}</span>
        </p>
      )}

      {pool.join_requires_approval && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4 text-sm text-yellow-400">
          🔒 This pool requires commissioner approval to join
        </div>
      )}

      {pool.max_members && (
        <div className="text-xs text-brand-muted mb-4">
          {memberCount}/{pool.max_members} members
          {memberCount >= pool.max_members * 0.9 && (
            <span className="text-yellow-400 ml-1">• Almost full!</span>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleJoin}
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3"
      >
        {loading ? (
          <><Loader2 size={18} className="animate-spin" /> Joining...</>
        ) : pool.join_requires_approval ? (
          '📋 Request to Join'
        ) : (
          '🏀 Join Pool'
        )}
      </button>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: 'text-green-400',
    active: 'text-brand-orange',
    locked: 'text-yellow-400',
    completed: 'text-gray-400',
    draft: 'text-blue-400',
  }
  return (
    <div>
      <div className={`text-xl font-black ${colors[status] || 'text-green-400'}`}>●</div>
      <div className="text-xs text-brand-muted capitalize">{status}</div>
    </div>
  )
}
