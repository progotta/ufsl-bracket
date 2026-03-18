'use client'

import { useState } from 'react'
import { X, Copy, Check, Loader2 } from 'lucide-react'

interface Props {
  poolId: string
  memberId: string
  entryFee: number
  bracketsOwed: number
  venmoHandle: string | null
  paymentInstructions: string | null
  onClose: () => void
  onPaid: () => void
}

export default function PayNowModal({
  poolId,
  memberId,
  entryFee,
  bracketsOwed,
  venmoHandle,
  paymentInstructions,
  onClose,
  onPaid,
}: Props) {
  const [copied, setCopied] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = entryFee * bracketsOwed

  const copyHandle = () => {
    if (!venmoHandle) return
    navigator.clipboard.writeText(venmoHandle)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClaim = async () => {
    setClaiming(true)
    setError(null)
    try {
      const res = await fetch(`/api/pools/${poolId}/members/${memberId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending_verification', note: 'Self-reported via Venmo' }),
      })
      if (res.ok) {
        setClaimed(true)
        setTimeout(() => { onPaid(); onClose() }, 1500)
      } else {
        setError('Something went wrong. Try again.')
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setClaiming(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-sm p-6 space-y-5" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-black text-lg">Pay Entry Fee</h2>
          <button onClick={onClose} className="text-brand-muted hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Amount breakdown */}
        <div className="bg-brand-card border border-brand-border rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-brand-muted">Entry fee</span>
            <span>${entryFee.toFixed(2)} per bracket</span>
          </div>
          {bracketsOwed > 1 && (
            <div className="flex justify-between text-sm">
              <span className="text-brand-muted">Brackets</span>
              <span>×{bracketsOwed}</span>
            </div>
          )}
          <div className="border-t border-brand-border pt-2 flex justify-between font-black">
            <span>Total owed</span>
            <span className="text-brand-orange">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Venmo info */}
        {venmoHandle ? (
          <div className="space-y-3">
            <p className="text-sm text-brand-muted">Open Venmo and send <strong className="text-white">${total.toFixed(2)}</strong> to:</p>
            <div className="flex items-center gap-3 bg-brand-card border border-brand-border rounded-xl px-4 py-3">
              <span className="text-xl font-black text-white flex-1">{venmoHandle}</span>
              <button onClick={copyHandle} className="text-brand-muted hover:text-white transition-colors shrink-0">
                {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        ) : paymentInstructions ? (
          <div className="bg-brand-card border border-brand-border rounded-xl p-4">
            <p className="text-sm">💳 {paymentInstructions}</p>
          </div>
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <p className="text-sm text-yellow-400">Contact the commissioner for payment details.</p>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* CTA */}
        {claimed ? (
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <Check size={20} className="text-green-400 shrink-0" />
            <div>
              <p className="font-bold text-sm text-green-400">Payment Claimed!</p>
              <p className="text-xs text-brand-muted mt-0.5">The commissioner will verify your payment.</p>
            </div>
          </div>
        ) : (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {claiming ? <Loader2 size={16} className="animate-spin" /> : null}
            I&apos;ve Paid
          </button>
        )}
      </div>
    </div>
  )
}
