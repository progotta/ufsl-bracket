'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'

export default function JoinByCodeForm() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    router.push(`/join/${code.trim().toUpperCase()}`)
  }

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-8">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">🔗</div>
        <h1 className="text-2xl font-black">Join a Pool</h1>
        <p className="text-brand-muted text-sm mt-2">Enter the invite code you received</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          placeholder="XXXXXXXX"
          maxLength={8}
          required
          className="input-base text-center text-2xl tracking-widest font-mono uppercase"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || code.length < 6}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <><span>Find Pool</span><ArrowRight size={16} /></>
          )}
        </button>
      </form>
    </div>
  )
}
