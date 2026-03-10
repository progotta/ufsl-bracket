'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewPoolPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
      return
    }

    // Create the pool
    const { data: pool, error: poolError } = await supabase
      .from('pools')
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        commissioner_id: session.user.id,
        is_public: isPublic,
      })
      .select()
      .single()

    if (poolError) {
      setError(poolError.message)
      setLoading(false)
      return
    }

    // Add commissioner as a member
    await supabase.from('pool_members').insert({
      pool_id: pool.id,
      user_id: session.user.id,
      role: 'commissioner',
    })

    router.push(`/pools/${pool.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="text-brand-muted hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-black">Create a Pool</h1>
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-2xl p-8">
        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Pool Name <span className="text-brand-orange">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Office Bracket Madness 2026"
              required
              maxLength={60}
              className="input-base"
            />
            <p className="text-xs text-brand-muted mt-1">{name.length}/60</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Description <span className="text-brand-muted font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add some trash talk or ground rules..."
              rows={3}
              maxLength={200}
              className="input-base resize-none"
            />
            <p className="text-xs text-brand-muted mt-1">{description.length}/200</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3">Scoring (Standard NCAA)</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { r: 'R64', pts: 1 },
                { r: 'R32', pts: 2 },
                { r: 'S16', pts: 4 },
                { r: 'E8', pts: 8 },
                { r: 'FF', pts: 16 },
                { r: 'Champ', pts: 32 },
              ].map(({ r, pts }) => (
                <div key={r} className="bg-brand-card rounded-lg p-3 text-center border border-brand-border">
                  <div className="text-xl font-black text-brand-orange">{pts}</div>
                  <div className="text-xs text-brand-muted mt-0.5">{r}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-brand-muted mt-2">Custom scoring coming soon</p>
          </div>

          <div className="flex items-center justify-between bg-brand-card rounded-xl p-4 border border-brand-border">
            <div>
              <div className="font-semibold text-sm">Public Pool</div>
              <div className="text-xs text-brand-muted mt-0.5">Anyone can find and join this pool</div>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isPublic ? 'bg-brand-orange' : 'bg-brand-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isPublic ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Link href="/dashboard" className="btn-secondary flex-1 text-center">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Creating...</>
              ) : (
                'Create Pool 🏀'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
