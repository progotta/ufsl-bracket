'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, RefreshCw, Users } from 'lucide-react'
import Link from 'next/link'
import {
  BRACKET_TYPE_META,
  BRACKET_TYPE_ORDER,
  isBracketTypeOpen,
  type BracketType,
} from '@/lib/secondChance'
import { PRESET_PAYOUTS } from '@/lib/payouts'
import type { Game } from '@/types/database'

export default function NewPoolPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [bracketType, setBracketType] = useState<BracketType>('full')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [maxBrackets, setMaxBrackets] = useState(1)
  const [feePerBracket, setFeePerBracket] = useState(true)
  const [onePayoutPerPerson, setOnePayoutPerPerson] = useState(false)
  const [hasFee, setHasFee] = useState(false)
  const [entryFee, setEntryFee] = useState('')
  const [payoutPreset, setPayoutPreset] = useState(JSON.stringify(PRESET_PAYOUTS[0].value))
  const [paymentInstructions, setPaymentInstructions] = useState('')
  const [methods, setMethods] = useState({ stripe: false, paypal: false, manual: true })
  const [manualPlatform, setManualPlatform] = useState('')
  const [manualHandle, setManualHandle] = useState('')
  const [manualMemo, setManualMemo] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Pre-select bracket type from query param (e.g. from /second-chance page)
  // Pre-populate pool name when coming from an existing pool
  useEffect(() => {
    const typeParam = searchParams.get('bracket_type') as BracketType | null
    if (typeParam && BRACKET_TYPE_ORDER.includes(typeParam)) {
      setBracketType(typeParam)
    }
    const fromName = searchParams.get('from_name')
    if (fromName) {
      setName(`${fromName} — 2nd Chance`)
    }
  }, [searchParams])

  // Load games to determine which bracket types are open
  // Also auto-select the first open bracket type if full is no longer available
  useEffect(() => {
    supabase
      .from('games')
      .select('id, round, status, team1_id, team2_id, winner_id, scheduled_at')
      .then(({ data }) => {
        if (data) {
          setGames(data as Game[])
          // If no bracket type was pre-selected and full is closed, default to first open type
          const typeParam = searchParams.get('bracket_type') as BracketType | null
          if (!typeParam) {
            const firstOpen = BRACKET_TYPE_ORDER.find(t => isBracketTypeOpen(t, data as Game[]))
            if (firstOpen && firstOpen !== 'full') setBracketType(firstOpen)
          }
        }
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

    // Build payment_methods JSONB array
    const paymentMethods: any[] = []
    if (hasFee) {
      if (methods.stripe) paymentMethods.push({ type: 'stripe' })
      if (methods.paypal) paymentMethods.push({ type: 'paypal' })
      if (methods.manual && manualPlatform) {
        paymentMethods.push({
          type: 'manual',
          platform: manualPlatform,
          handle: manualHandle.trim() || undefined,
          link: undefined,
          instructions: manualMemo.trim() || undefined,
        })
      }
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
        entry_fee: hasFee && entryFee ? parseFloat(entryFee) : 0,
        payout_structure: hasFee && entryFee ? JSON.parse(payoutPreset) : null,
        payment_instructions: hasFee && paymentInstructions.trim() ? paymentInstructions.trim() : null,
        payment_methods: paymentMethods,
        max_brackets_per_member: maxBrackets,
        fee_per_bracket: feePerBracket,
        one_payout_per_person: onePayoutPerPerson,
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

          {searchParams.get('from_pool') && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-sm text-blue-400 flex items-center gap-2 mb-4">
              <Users size={15} />
              Your existing pool members will be notified when this pool is ready to join.
            </div>
          )}

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
                // Availability based purely on tournament state
                const isAvailable = isOpen

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

          {/* Multi-bracket settings */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm">Bracket Rules</h3>

            <div>
              <label className="text-sm text-brand-muted mb-2 block">
                Max brackets per person
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMaxBrackets(n)}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                      maxBrackets === n
                        ? 'bg-brand-orange text-white'
                        : 'bg-brand-surface text-brand-muted hover:text-white'
                    }`}
                  >
                    {n === 5 ? '5+' : n}
                  </button>
                ))}
              </div>
            </div>

            {maxBrackets > 1 && hasFee && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={feePerBracket}
                  onChange={e => setFeePerBracket(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <div>
                  <span className="font-medium text-sm">Charge per bracket</span>
                  <p className="text-xs text-brand-muted">
                    {feePerBracket
                      ? `$${entryFee || '0'} x brackets submitted (2 brackets = $${Number(entryFee || 0) * 2})`
                      : `Flat $${entryFee || '0'} per person regardless of bracket count`}
                  </p>
                </div>
              </label>
            )}

            {maxBrackets > 1 && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onePayoutPerPerson}
                  onChange={e => setOnePayoutPerPerson(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <div>
                  <span className="font-medium text-sm">One payout per person</span>
                  <p className="text-xs text-brand-muted">
                    If someone has multiple brackets, only their best one is eligible for prizes
                  </p>
                </div>
              </label>
            )}
          </div>

          {/* Entry Fee (optional) */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasFee}
                onChange={e => setHasFee(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="font-medium">💰 Entry Fee</span>
            </label>

            {hasFee && (
              <div className="space-y-3 pl-7">
                <div className="flex items-center gap-2">
                  <span className="text-brand-muted">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="10.00"
                    value={entryFee}
                    onChange={e => setEntryFee(e.target.value)}
                    className="input-base w-32"
                  />
                  <span className="text-brand-muted text-sm">per bracket</span>
                </div>

                <div>
                  <label className="text-sm text-brand-muted mb-2 block">Payout Structure</label>
                  <select value={payoutPreset} onChange={e => setPayoutPreset(e.target.value)} className="input-base w-full">
                    {PRESET_PAYOUTS.map(p => (
                      <option key={p.label} value={JSON.stringify(p.value)}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-brand-muted mb-3 block font-medium">
                    How will you collect payment? (pick any)
                  </label>
                  <div className="space-y-2">
                    {/* Credit/Debit — Coming Soon */}
                    <div className="flex items-start gap-3 p-3 rounded-xl border border-brand-border/40 opacity-50 cursor-not-allowed select-none">
                      <input type="checkbox" disabled className="mt-0.5 cursor-not-allowed" />
                      <div>
                        <div className="flex items-center gap-2 font-medium text-sm text-brand-muted">
                          <span>Credit/Debit Card</span>
                          <span className="text-xs bg-brand-surface text-brand-muted px-2 py-0.5 rounded-full border border-brand-border">Coming Soon</span>
                        </div>
                        <p className="text-xs text-brand-muted/60 mt-0.5">Credit/debit cards, Apple Pay, Google Pay via Stripe</p>
                      </div>
                    </div>

                    {/* PayPal — Coming Soon */}
                    <div className="flex items-start gap-3 p-3 rounded-xl border border-brand-border/40 opacity-50 cursor-not-allowed select-none">
                      <input type="checkbox" disabled className="mt-0.5 cursor-not-allowed" />
                      <div>
                        <div className="flex items-center gap-2 font-medium text-sm text-brand-muted">
                          <span>PayPal</span>
                          <span className="text-xs bg-brand-surface text-brand-muted px-2 py-0.5 rounded-full border border-brand-border">Coming Soon</span>
                        </div>
                        <p className="text-xs text-brand-muted/60 mt-0.5">PayPal balance or any card</p>
                      </div>
                    </div>

                    {/* Other — pre-checked, fully functional */}
                    <label className="flex items-start gap-3 p-3 rounded-xl border border-brand-border cursor-pointer hover:bg-brand-surface/50">
                      <input type="checkbox" checked={methods.manual} onChange={e => setMethods(m => ({...m, manual: e.target.checked}))} className="mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 font-medium text-sm">
                          <span>Other (Venmo, Cash App, Zelle...)</span>
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Manual tracking</span>
                        </div>
                        <p className="text-xs text-brand-muted mt-0.5">You track payments manually — members click &quot;I&apos;ve paid&quot;</p>
                      </div>
                    </label>

                    {methods.manual && (
                      <div className="pl-7 space-y-2">
                        <select value={manualPlatform} onChange={e => setManualPlatform(e.target.value)} className="input-base w-full">
                          <option value="">Select platform...</option>
                          <option value="Venmo">Venmo</option>
                          <option value="Cash App">Cash App</option>
                          <option value="Zelle">Zelle</option>
                          <option value="Other">Other</option>
                        </select>
                        <input type="text" placeholder="@handle or link (e.g. venmo.com/yourname)" value={manualHandle} onChange={e => setManualHandle(e.target.value)} className="input-base w-full" />
                        <input type="text" placeholder='Memo instructions (e.g. "bracket + your name")' value={manualMemo} onChange={e => setManualMemo(e.target.value)} className="input-base w-full" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
