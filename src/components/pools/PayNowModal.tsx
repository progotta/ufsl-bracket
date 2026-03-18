'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  poolId: string
  userId: string
  memberId: string
  entryFee: number
  venmoHandle: string | null
  paymentInstructions: string | null
  onClose: () => void
  onAnyPaid: () => void
}

interface BracketPayment {
  id: string
  bracket_id: string | null
  amount: number
  status: string
  bracket_name: string | null
}

export default function PayNowModal({
  poolId,
  userId,
  memberId,
  entryFee,
  venmoHandle,
  paymentInstructions,
  onClose,
  onAnyPaid,
}: Props) {
  const [copied, setCopied] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payments, setPayments] = useState<BracketPayment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    async function fetchPayments() {
      const { data } = await supabase
        .from('payments')
        .select('id, bracket_id, amount, status, brackets(bracket_name, name)')
        .eq('pool_id', poolId)
        .eq('user_id', userId)
        .order('created_at')

      if (data) {
        setPayments(data.map((p: any) => ({
          id: p.id,
          bracket_id: p.bracket_id,
          amount: Number(p.amount) || entryFee,
          status: p.status,
          bracket_name: p.brackets?.bracket_name || p.brackets?.name || null,
        })))
      }
      setLoading(false)
    }
    fetchPayments()
  }, [poolId, userId, entryFee])

  const paidAmount = payments.filter(p => p.status === 'paid' || p.status === 'waived').reduce((s, p) => s + p.amount, 0)
  const owedAmount = payments.filter(p => p.status === 'unpaid' || p.status === 'pending_verification').reduce((s, p) => s + p.amount, 0)
  const allPaid = payments.length > 0 && owedAmount === 0

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
      const supabase = createClient()
      const unpaidIds = payments.filter(p => p.status === 'unpaid').map(p => p.id)
      if (unpaidIds.length === 0) {
        setClaimed(true)
        return
      }
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'pending_verification',
          payment_note: 'Self-reported via Venmo',
          payment_date: new Date().toISOString(),
        })
        .in('id', unpaidIds)

      if (updateError) {
        setError('Something went wrong. Try again.')
      } else {
        // Also update pool_members for backward compat
        await fetch(`/api/pools/${poolId}/members/${memberId}/payment`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'pending_verification', note: 'Self-reported via Venmo' }),
        })
        setClaimed(true)
        setPayments(prev => prev.map(p =>
          unpaidIds.includes(p.id) ? { ...p, status: 'pending_verification' } : p
        ))
        setTimeout(() => { onAnyPaid(); onClose() }, 1500)
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setClaiming(false)
    }
  }

  const statusBadge = (status: string) => {
    if (status === 'paid' || status === 'waived') {
      return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">Paid</span>
    }
    if (status === 'pending_verification') {
      return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Pending</span>
    }
    return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Unpaid</span>
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-sm flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Sticky header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-brand-border shrink-0">
          <h2 className="font-black text-lg">Entry Fees</h2>
          <button onClick={onClose} className="text-brand-muted hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-brand-muted" />
            </div>
          ) : allPaid && !claimed ? (
            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <Check size={20} className="text-green-400 shrink-0" />
              <div>
                <p className="font-bold text-sm text-green-400">All paid up!</p>
                <p className="text-xs text-brand-muted mt-0.5">All your brackets are covered.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Per-bracket list */}
              <div className="bg-brand-card border border-brand-border rounded-xl divide-y divide-brand-border">
                {payments.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {p.bracket_name || `Bracket ${idx + 1}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">${p.amount.toFixed(2)}</span>
                      {statusBadge(p.status)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-brand-card border border-brand-border rounded-xl p-4 space-y-2">
                {paidAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-muted">Paid</span>
                    <span className="text-green-400 font-bold">${paidAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-brand-muted">Still owed</span>
                  <span className={`font-black ${owedAmount > 0 ? 'text-brand-orange' : 'text-green-400'}`}>
                    ${owedAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Venmo info */}
              {owedAmount > 0 && !claimed && (
                venmoHandle ? (
                  <div className="space-y-3">
                    <p className="text-sm text-brand-muted">
                      Venmo <strong className="text-white">${owedAmount.toFixed(2)}</strong> to:
                    </p>
                    <div className="flex items-center gap-3 bg-brand-card border border-brand-border rounded-xl px-4 py-3">
                      <span className="text-xl font-black text-white flex-1">{venmoHandle}</span>
                      <button onClick={copyHandle} className="text-brand-muted hover:text-white transition-colors shrink-0">
                        {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                ) : paymentInstructions ? (
                  <div className="bg-brand-card border border-brand-border rounded-xl p-4">
                    <p className="text-sm">{paymentInstructions}</p>
                  </div>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                    <p className="text-sm text-yellow-400">Contact the commissioner for payment details.</p>
                  </div>
                )
              )}

              {/* Claimed state */}
              {claimed && (
                <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <Check size={20} className="text-green-400 shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-green-400">Payment Claimed!</p>
                    <p className="text-xs text-brand-muted mt-0.5">The commissioner will verify your payment.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pinned bottom — CTA button */}
        {owedAmount > 0 && !claimed && !loading && (
          <div className="px-6 pb-6 pt-3 border-t border-brand-border shrink-0">
            {error && <p className="text-sm text-red-400 mb-2">{error}</p>}
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {claiming ? <Loader2 size={16} className="animate-spin" /> : null}
              I&apos;ve Paid &mdash; Notify Commissioner
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
