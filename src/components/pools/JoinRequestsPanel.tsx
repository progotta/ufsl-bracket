'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Check, X } from 'lucide-react'

interface JoinRequest {
  id: string
  user_id: string
  created_at: string
  profiles: { display_name: string | null; avatar_url: string | null } | null
}

interface JoinRequestsPanelProps {
  poolId: string
}

export default function JoinRequestsPanel({ poolId }: JoinRequestsPanelProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/pools/${poolId}/join-requests`)
      const data = await res.json()
      setRequests(data.requests || [])
    } catch {
      // ignore
    }
    setLoading(false)
  }, [poolId])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleAction = async (requestId: string, action: 'approve' | 'deny') => {
    setActing(requestId)
    try {
      await fetch(`/api/pools/${poolId}/join-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      })
      setRequests(prev => prev.filter(r => r.id !== requestId))
    } catch {
      // ignore
    }
    setActing(null)
  }

  if (loading) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-4">Join Requests</h2>
        <div className="flex items-center gap-2 text-brand-muted">
          <Loader2 size={16} className="animate-spin" />
          Loading...
        </div>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-2">Join Requests</h2>
        <p className="text-brand-muted text-sm">No pending requests.</p>
      </div>
    )
  }

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
      <h2 className="font-bold text-lg mb-4">
        Join Requests <span className="text-brand-orange">({requests.length})</span>
      </h2>
      <div className="space-y-3">
        {requests.map(req => (
          <div key={req.id} className="flex items-center gap-3 bg-brand-card border border-brand-border rounded-xl p-3">
            {req.profiles?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={req.profiles.avatar_url} alt="" className="w-9 h-9 rounded-full" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold text-sm">
                {(req.profiles?.display_name || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {req.profiles?.display_name || 'Anonymous'}
              </div>
              <div className="text-xs text-brand-muted">
                {new Date(req.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAction(req.id, 'approve')}
                disabled={acting === req.id}
                className="flex items-center gap-1 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              >
                {acting === req.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Approve
              </button>
              <button
                onClick={() => handleAction(req.id, 'deny')}
                disabled={acting === req.id}
                className="flex items-center gap-1 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <X size={12} />
                Deny
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
