'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import {
  BRACKET_TYPE_META,
  BRACKET_TYPE_ORDER,
  isBracketTypeOpen,
  type BracketType,
} from '@/lib/secondChance'
import type { Game } from '@/types/database'

export default function NewPoolPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [bracketType, setBracketType] = useState<BracketType>('full')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Pre-select bracket type from query param (e.g. from /second-chance page)
  useEffect(() => {
    const typeParam = searchParams.get('bracket_type') as BracketType | null
    if (typeParam && BRACKET_TYPE_ORDER.includes(typeParam)) {
      setBracketType(typeParam)
    }
  }, [searchParams])

  // Load games to determine which bracket types are open
  useEffect(() => {
    supabase
      .from('games')
      .select('id, round, status, team1_id, team2_id, winner_id, scheduled_at')
      .then(({ data }) => {
        if (data) setGames(data as Game[])
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
        bracket_type: bracketType,
      } as any)
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

  const selectedMeta = BRACKET_TYPE_META[bracketType]

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

          {/* Bracket Type Selector */}
          <div>
            <label className="block text-sm font-semibold mb-3">
              Bracket Type <span className="text-brand-orange">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BRACKET_TYPE_ORDER.map(type => {
                const meta = BRACKET_TYPE_META[type]
                const isOpen = isBracketTypeOpen(type, games)
                const isSelected = bracketType === type
                // Full is always available (pre-tournament), others based on round
                const isAvailable = type === 'full' || isOpen

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => isAvailable && setBracketType(type)}
                    disabled={!isAvailable}
                    className={`
                      relative text-left p-4 rounded-xl border transition-all
                      ${isSelected
                        ? `${meta.accentBg} ${meta.accentBorder} border-2`
                        : isAvailable
                          ? 'border-brand-border hover:border-brand-orange/40 bg-brand-card'
                          : 'border-brand-border bg-brand-card opacity-40 cursor-not-allowed'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xl">{meta.emoji}</span>
                      <span className="font-bold text-sm">{meta.shortLabel}</span>
                      {isOpen && type !== 'full' && (
                        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${meta.accentBg} ${meta.accentText} border ${meta.accentBorder}`}>
                          OPEN
                        </span>
                      )}
                      {!isAvailable && (
                        <span className="ml-auto text-xs text-brand-muted px-2 py-0.5 rounded-full bg-brand-border/30">
                          Locked
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-brand-muted">{meta.tagline}</div>
                    <div className="text-xs text-brand-muted mt-0.5">
                      {meta.teams} teams · {meta.picks} picks
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Selected type info */}
            <div className={`mt-3 p-3 rounded-lg ${selectedMeta.accentBg} border ${selectedMeta.accentBorder}`}>
              <div className={`text-sm font-semibold ${selectedMeta.accentText}`}>
                {selectedMeta.emoji} {selectedMeta.headline}
              </div>
              <div className="text-xs text-brand-muted mt-0.5">{selectedMeta.description}</div>
            </div>

            {bracketType !== 'full' && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-400">
                <RefreshCw size={11} />
                Only brackets of type &quot;{selectedMeta.shortLabel}&quot; can join this pool.
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Pool Name <span className="text-brand-orange">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={`e.g. ${bracketType === 'full' ? 'Office Bracket Madness 2026' : `${selectedMeta.shortLabel} Challenge`}`}
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
                `Create Pool ${selectedMeta.emoji}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
