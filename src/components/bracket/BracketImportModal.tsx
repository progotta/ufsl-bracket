'use client'

import { useState, useCallback, useRef } from 'react'
import { X, Upload, CheckCircle, AlertTriangle, Loader2, ChevronRight, Download, Trophy, RotateCcw } from 'lucide-react'
import clsx from 'clsx'
import type { ExtractedPick, ImportResult } from '@/app/api/bracket/import/route'
import { ROUND_NAMES } from '@/lib/bracket'

// ── Provider config ───────────────────────────────────────────────────────────

interface Provider {
  id: string
  name: string
  emoji: string
  color: string
  description: string
}

const PROVIDERS: Provider[] = [
  { id: 'espn',  name: 'ESPN',  emoji: '🔴', color: '#CC0000', description: 'ESPN Tournament Challenge' },
  { id: 'yahoo', name: 'Yahoo', emoji: '🟣', color: '#6001D2', description: 'Yahoo Sports Tourney Pick\'em' },
  { id: 'cbs',   name: 'CBS',   emoji: '🔵', color: '#0033A0', description: 'CBS Sports Bracket Games' },
  { id: 'ncaa',  name: 'NCAA',  emoji: '🏀', color: '#005EB8', description: 'NCAA.com Official Bracket' },
  { id: 'other', name: 'Other', emoji: '⚪', color: '#666',    description: 'Any other bracket screenshot' },
]

// ── Step types ────────────────────────────────────────────────────────────────

type Step = 'provider' | 'upload' | 'processing' | 'review' | 'success'

// ── Confidence badge ──────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence, needsReview }: { confidence: number; needsReview: boolean }) {
  if (!needsReview) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-400 font-medium">
        <CheckCircle size={11} /> matched
      </span>
    )
  }
  if (confidence < 0.5) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-400 font-medium">
        <AlertTriangle size={11} /> unmatched
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-yellow-400 font-medium">
      <AlertTriangle size={11} /> uncertain
    </span>
  )
}

// ── Pick row ──────────────────────────────────────────────────────────────────

function PickRow({
  pick,
  onOverride,
  teams,
}: {
  pick: ExtractedPick
  onOverride: (gameId: string, teamId: string) => void
  teams: Array<{ id: string; name: string; seed: number; region: string }>
}) {
  const [editing, setEditing] = useState(false)

  const regionTeams = teams.filter(t => t.region === pick.region || pick.round >= 5)

  return (
    <div
      className={clsx(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
        pick.needsReview
          ? pick.matchedTeamId
            ? 'bg-yellow-500/10 border border-yellow-500/20'
            : 'bg-red-500/10 border border-red-500/20'
          : 'bg-brand-dark/40'
      )}
    >
      {/* Round badge */}
      <span className="text-xs text-brand-muted font-mono w-6 text-center shrink-0">
        R{pick.round}
      </span>

      {/* Extracted name */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{pick.extractedName}</p>
        <p className="text-brand-muted text-xs truncate">
          {pick.matchedTeamName
            ? `→ ${pick.matchedTeamName}`
            : 'No match found'}
        </p>
      </div>

      {/* Confidence + edit */}
      <div className="flex items-center gap-2 shrink-0">
        <ConfidenceBadge confidence={pick.confidence} needsReview={pick.needsReview} />

        {pick.needsReview && (
          <button
            onClick={() => setEditing(e => !e)}
            className="text-xs px-2 py-0.5 rounded border border-brand-border text-brand-muted hover:text-white hover:border-white/30 transition-colors"
          >
            Fix
          </button>
        )}
      </div>

      {/* Override selector */}
      {editing && (
        <div className="absolute left-0 right-0 mt-1 top-full z-50">
          <select
            autoFocus
            className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-white text-sm"
            defaultValue={pick.matchedTeamId || ''}
            onChange={e => {
              if (e.target.value) {
                onOverride(pick.gameId, e.target.value)
                setEditing(false)
              }
            }}
            onBlur={() => setEditing(false)}
          >
            <option value="">Select team…</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>
                ({t.seed}) {t.name} — {t.region}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────

interface BracketImportModalProps {
  onClose: () => void
  onApply: (picks: Record<string, string>) => void
  teams: Array<{ id: string; name: string; seed: number; region: string; abbreviation: string }>
}

export default function BracketImportModal({ onClose, onApply, teams }: BracketImportModalProps) {
  const [step, setStep] = useState<Step>('provider')
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [applied, setApplied] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, WebP, or GIF).')
      return
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('Image too large. Please upload an image under 20MB.')
      return
    }
    setError(null)
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const f = e.dataTransfer.files[0]
      if (f) handleFileSelect(f)
    },
    [handleFileSelect]
  )

  const handleProcess = async () => {
    if (!file) return
    setProcessing(true)
    setError(null)
    setStep('processing')

    try {
      const form = new FormData()
      form.append('image', file)
      form.append('provider', selectedProvider?.id || 'other')

      const res = await fetch('/api/bracket/import', {
        method: 'POST',
        body: form,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Import failed. Please try again.')
        setStep('upload')
        return
      }

      setResult(data as ImportResult)
      setStep('review')
    } catch {
      setError('Network error. Please check your connection and try again.')
      setStep('upload')
    } finally {
      setProcessing(false)
    }
  }

  const handleOverride = useCallback((gameId: string, teamId: string) => {
    setOverrides(prev => ({ ...prev, [gameId]: teamId }))
  }, [])

  const handleApply = () => {
    if (!result) return
    // Merge AI picks + user overrides
    const finalPicks: Record<string, string> = { ...result.picks }

    // Also include user-confirmed picks for uncertain items
    for (const pick of result.extractedPicks) {
      if (pick.matchedTeamId && !finalPicks[pick.gameId]) {
        finalPicks[pick.gameId] = pick.matchedTeamId
      }
    }

    // Apply overrides last
    Object.assign(finalPicks, overrides)

    setApplied(true)
    setStep('success')
    setTimeout(() => {
      onApply(finalPicks)
      onClose()
    }, 1800)
  }

  const finalPicks = result
    ? {
        ...result.picks,
        ...result.extractedPicks
          .filter(p => p.matchedTeamId && !result.picks[p.gameId])
          .reduce((acc, p) => ({ ...acc, [p.gameId]: p.matchedTeamId! }), {}),
        ...overrides,
      }
    : {}

  const totalExtracted = result?.extractedPicks.length || 0
  const totalApplied = Object.keys(finalPicks).length

  // Group picks by round for review UI
  const picksByRound = result
    ? result.extractedPicks.reduce<Record<number, ExtractedPick[]>>((acc, p) => {
        if (!acc[p.round]) acc[p.round] = []
        acc[p.round].push(p)
        return acc
      }, {})
    : {}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-brand-card border border-brand-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <div className="flex items-center gap-3">
            <Download size={20} className="text-brand-orange" />
            <div>
              <h2 className="text-lg font-bold text-white">Import Bracket</h2>
              <p className="text-xs text-brand-muted">
                {step === 'provider' && 'Choose your bracket provider'}
                {step === 'upload' && `Upload your ${selectedProvider?.name || ''} bracket screenshot`}
                {step === 'processing' && 'AI is reading your bracket…'}
                {step === 'review' && `Found ${totalExtracted} picks — review before applying`}
                {step === 'success' && 'Bracket imported successfully!'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-brand-muted hover:text-white hover:bg-brand-dark/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress steps */}
        <div className="px-6 py-3 border-b border-brand-border shrink-0">
          <div className="flex items-center gap-2">
            {(['provider', 'upload', 'processing', 'review'] as Step[]).map((s, i) => {
              const stepIdx = ['provider', 'upload', 'processing', 'review'].indexOf(step)
              const thisIdx = i
              const done = thisIdx < stepIdx || step === 'success'
              const active = s === step

              return (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={clsx(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                      done
                        ? 'bg-green-500 text-white'
                        : active
                        ? 'bg-brand-orange text-white'
                        : 'bg-brand-dark text-brand-muted'
                    )}
                  >
                    {done ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  {i < 3 && (
                    <div
                      className={clsx(
                        'h-px flex-1 w-8 transition-colors',
                        done ? 'bg-green-500' : 'bg-brand-border'
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Step 1: Provider ── */}
          {step === 'provider' && (
            <div className="p-6">
              <p className="text-brand-muted text-sm mb-4">
                Where did you fill out your bracket? This helps us better read the image format.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PROVIDERS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProvider(p)
                      setStep('upload')
                    }}
                    className={clsx(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center hover:scale-105 active:scale-100',
                      selectedProvider?.id === p.id
                        ? 'border-brand-orange bg-brand-orange/10'
                        : 'border-brand-border bg-brand-dark/40 hover:border-brand-orange/50'
                    )}
                  >
                    <span className="text-3xl">{p.emoji}</span>
                    <span className="font-bold text-white text-sm">{p.name}</span>
                    <span className="text-xs text-brand-muted leading-snug">{p.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Upload ── */}
          {step === 'upload' && (
            <div className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                  <AlertTriangle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                  dragOver
                    ? 'border-brand-orange bg-brand-orange/10 scale-[1.01]'
                    : previewUrl
                    ? 'border-green-500/40 bg-green-500/5'
                    : 'border-brand-border hover:border-brand-orange/50 hover:bg-brand-dark/60'
                )}
              >
                {previewUrl ? (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Bracket preview"
                      className="max-h-48 mx-auto rounded-lg object-contain shadow-lg"
                    />
                    <p className="text-green-400 text-sm font-medium flex items-center justify-center gap-1">
                      <CheckCircle size={14} /> {file?.name}
                    </p>
                    <p className="text-brand-muted text-xs">Click to change image</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload size={40} className="mx-auto text-brand-muted" />
                    <div>
                      <p className="text-white font-semibold">Drop screenshot here</p>
                      <p className="text-brand-muted text-sm">or click to browse</p>
                    </div>
                    <p className="text-brand-muted text-xs">JPEG, PNG, WebP or GIF · Max 20MB</p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleFileSelect(f)
                }}
              />

              {/* Tips */}
              <div className="bg-brand-dark/60 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Tips for best results</p>
                <ul className="text-xs text-brand-muted space-y-1 list-disc list-inside">
                  <li>Take a full-screen screenshot of your completed bracket</li>
                  <li>Make sure all team names are legible</li>
                  <li>The entire bracket should be visible (not cropped)</li>
                  <li>Higher resolution = better accuracy</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setStep('provider')}
                  className="text-sm text-brand-muted hover:text-white transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleProcess}
                  disabled={!file}
                  className={clsx(
                    'btn-primary flex items-center gap-2',
                    !file && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span>Analyze Bracket</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Processing ── */}
          {step === 'processing' && (
            <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-brand-orange/10 border border-brand-orange/30 flex items-center justify-center">
                  <Loader2 size={36} className="text-brand-orange animate-spin" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-brand-orange flex items-center justify-center">
                  <span className="text-xs">🏀</span>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-2">Reading your bracket…</h3>
                <p className="text-brand-muted text-sm max-w-xs">
                  Claude Vision is analyzing your screenshot and extracting all 63 picks. This usually takes 10–20 seconds.
                </p>
              </div>

              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-brand-orange animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4: Review ── */}
          {step === 'review' && result && (
            <div className="divide-y divide-brand-border">
              {/* Summary bar */}
              <div className="px-6 py-4 bg-brand-dark/40">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-400" />
                    <span className="text-white font-bold">{totalApplied}</span>
                    <span className="text-brand-muted">picks extracted</span>
                  </div>
                  {result.uncertainCount > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-yellow-400" />
                      <span className="text-yellow-400 font-bold">{result.uncertainCount}</span>
                      <span className="text-brand-muted">uncertain</span>
                    </div>
                  )}
                  {result.unmatchedCount > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-red-400" />
                      <span className="text-red-400 font-bold">{result.unmatchedCount}</span>
                      <span className="text-brand-muted">unmatched</span>
                    </div>
                  )}
                </div>
                {(result.uncertainCount > 0 || result.unmatchedCount > 0) && (
                  <p className="text-xs text-brand-muted mt-2">
                    Yellow = uncertain match (click &quot;Fix&quot; to correct). Red = no match found.
                    You can apply now and fix picks manually in the bracket editor.
                  </p>
                )}
              </div>

              {/* Picks grouped by round */}
              <div className="px-4 py-4 space-y-4">
                {Object.entries(picksByRound)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([round, picks]) => (
                    <div key={round}>
                      <h4 className="text-xs font-bold text-brand-muted uppercase tracking-wide mb-2 px-1">
                        {ROUND_NAMES[parseInt(round)] || `Round ${round}`}
                        <span className="ml-2 font-normal normal-case">
                          ({picks.filter(p => !p.needsReview).length}/{picks.length} matched)
                        </span>
                      </h4>
                      <div className="space-y-1.5 relative">
                        {picks.map((pick, i) => (
                          <PickRow
                            key={`${pick.gameId}-${i}`}
                            pick={pick}
                            onOverride={handleOverride}
                            teams={teams}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ── Step 5: Success ── */}
          {step === 'success' && (
            <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <Trophy size={36} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white mb-2">Bracket Imported! 🎉</h3>
                <p className="text-brand-muted">
                  {totalApplied} picks applied to your bracket.
                </p>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-green-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {step === 'review' && result && (
          <div className="px-6 py-4 border-t border-brand-border shrink-0 flex items-center justify-between gap-4">
            <button
              onClick={() => {
                setStep('upload')
                setResult(null)
                setOverrides({})
                setFile(null)
                setPreviewUrl(null)
              }}
              className="flex items-center gap-2 text-sm text-brand-muted hover:text-white transition-colors"
            >
              <RotateCcw size={14} />
              Try different image
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={totalApplied === 0}
                className={clsx(
                  'btn-primary flex items-center gap-2 text-sm',
                  totalApplied === 0 && 'opacity-50 cursor-not-allowed'
                )}
              >
                <CheckCircle size={16} />
                Apply {totalApplied} Picks
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
