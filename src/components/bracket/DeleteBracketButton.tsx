'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  bracketId: string
  bracketName: string
  canDelete: boolean // false if payment is paid/pending/waived
}

export default function DeleteBracketButton({ bracketId, bracketName, canDelete }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  if (!canDelete) return null

  const handleDelete = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/brackets/${bracketId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to delete bracket')
        setConfirming(false)
      } else {
        router.refresh()
      }
    } catch {
      setError('Something went wrong')
      setConfirming(false)
    } finally {
      setLoading(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs text-brand-muted">Delete?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={11} className="animate-spin" /> : 'Yes'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-surface text-brand-muted border border-brand-border hover:text-white transition-colors"
        >
          No
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      title={`Delete ${bracketName}`}
      className="shrink-0 text-brand-muted hover:text-red-400 transition-colors"
    >
      <Trash2 size={14} />
    </button>
  )
}
