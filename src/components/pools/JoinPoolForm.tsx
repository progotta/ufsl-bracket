'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Users } from 'lucide-react'
import type { Pool } from '@/types/database'

interface JoinPoolFormProps {
  pool: Pool
  userId: string
}

export default function JoinPoolForm({ pool, userId }: JoinPoolFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleJoin = async () => {
    setLoading(true)
    setError(null)

    const { error: joinError } = await supabase.from('pool_members').insert({
      pool_id: pool.id,
      user_id: userId,
      role: 'member',
    })

    if (joinError) {
      setError(joinError.message)
      setLoading(false)
    } else {
      router.push(`/pools/${pool.id}`)
    }
  }

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 text-center">
      <div className="bg-brand-orange/10 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
        <Users size={30} className="text-brand-orange" />
      </div>
      <h1 className="text-2xl font-black mb-2">You're invited!</h1>
      <p className="text-brand-muted mb-6">Join this bracket pool and start picking</p>

      <div className="bg-brand-card rounded-xl p-4 mb-6 text-left">
        <div className="text-xs text-brand-muted uppercase tracking-wide mb-1">Pool</div>
        <div className="text-xl font-bold">{pool.name}</div>
        {pool.description && (
          <p className="text-brand-muted text-sm mt-1">{pool.description}</p>
        )}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
            {pool.status}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleJoin}
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader2 size={18} className="animate-spin" /> Joining...</>
        ) : (
          '🏀 Join Pool'
        )}
      </button>
    </div>
  )
}
