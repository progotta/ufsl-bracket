'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/payouts'
import PlayerAvatar from '@/components/ui/PlayerAvatar'

interface Member {
  id: string
  user_id: string
  role: string
  payment_status: string | null
  profiles: { display_name: string | null; avatar_url: string | null; avatar_icon: string | null } | null
}

interface BracketInfo {
  id: string
  user_id: string
  is_submitted: boolean
  bracket_name: string | null
  name: string | null
}

interface Payment {
  id: string
  pool_id: string
  user_id: string
  bracket_id: string | null
  amount: number
  status: string
  payment_date: string | null
}

interface Props {
  members: Member[]
  allBrackets: BracketInfo[]
  initialPayments: Payment[]
  entryFee: number
  poolId: string
}

export default function PaymentTrackerClient({ members, allBrackets, initialPayments, entryFee, poolId }: Props) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const supabase = createClient()

  const updatePaymentStatus = async (paymentId: string, newStatus: string) => {
    setLoadingId(paymentId)
    const { error } = await supabase
      .from('payments')
      .update({ status: newStatus, payment_date: newStatus === 'paid' ? new Date().toISOString() : null })
      .eq('id', paymentId)

    if (!error) {
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: newStatus } : p))
    }
    setLoadingId(null)
  }

  const createAndMarkPaid = async (bracketId: string, userId: string) => {
    setLoadingId(bracketId)
    const { data, error } = await supabase
      .from('payments')
      .insert({
        pool_id: poolId,
        bracket_id: bracketId,
        user_id: userId,
        amount: entryFee,
        status: 'paid',
        payment_method: 'manual',
        payment_date: new Date().toISOString(),
      })
      .select()
      .single()

    if (!error && data) {
      setPayments(prev => [...prev, data as Payment])
    }
    setLoadingId(null)
  }

  return (
    <section>
      <h3 className="font-black text-lg mb-3">Payment Tracker</h3>
      <div className="space-y-2">
        {members.map((member) => {
          const profile = member.profiles as any
          const displayName = profile?.display_name || 'Anonymous'
          const memberPayments = payments.filter(p => p.user_id === member.user_id)
          const memberBrackets = allBrackets.filter(b => b.user_id === member.user_id && b.is_submitted)
          const paidCount = memberPayments.filter(p => p.status === 'paid' || p.status === 'waived').length
          const totalBrackets = memberBrackets.length || 1
          const amountOwed = memberPayments
            .filter(p => p.status === 'unpaid' || p.status === 'pending_verification')
            .reduce((s, p) => s + (Number(p.amount) || 0), 0)

          const hasSubmittedBracket = allBrackets.some(b => b.user_id === member.user_id && b.is_submitted)

          const summaryBadge = amountOwed === 0 && paidCount > 0
            ? <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">Paid ✓</span>
            : <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">{formatCurrency(amountOwed)} owed</span>

          return (
            <div key={member.user_id} className="bg-brand-surface border border-brand-border rounded-xl p-3">
              {/* Member header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PlayerAvatar
                    userId={member.user_id}
                    displayName={displayName}
                    avatarUrl={profile?.avatar_url}
                    avatarIcon={profile?.avatar_icon}
                    size="w-8 h-8"
                    borderClass="border-brand-border/40"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-sm">{displayName}</p>
                      {hasSubmittedBracket
                        ? <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                        : <AlertTriangle size={14} className="text-yellow-400 shrink-0" />
                      }
                    </div>
                    <p className="text-xs text-brand-muted">{paidCount}/{totalBrackets} brackets paid</p>
                  </div>
                </div>
                {member.payment_status === 'waived' ? (
                  <span className="text-xs text-brand-muted bg-brand-surface px-2 py-1 rounded-full border border-brand-border">Waived</span>
                ) : summaryBadge}
              </div>

              {/* Per-bracket rows */}
              {memberBrackets.length > 0 && (
                <div className="mt-2 ml-11 space-y-1 border-t border-brand-border pt-2">
                  {memberBrackets.map((bracket, idx) => {
                    const payment = memberPayments.find(p => p.bracket_id === bracket.id)
                    const bracketLabel = bracket.bracket_name || bracket.name || `Bracket ${idx + 1}`
                    const isLoading = loadingId === (payment?.id || bracket.id)

                    if (isLoading) {
                      return (
                        <div key={bracket.id} className="flex items-center justify-between text-sm py-1">
                          <span className="text-brand-muted text-xs">{bracketLabel}</span>
                          <Loader2 size={14} className="animate-spin text-brand-muted" />
                        </div>
                      )
                    }

                    if (!payment) {
                      // No payment record — offer to create one
                      return (
                        <div key={bracket.id} className="flex items-center justify-between text-sm py-1">
                          <span className="text-brand-muted text-xs">{bracketLabel} — {formatCurrency(entryFee)}</span>
                          <button
                            onClick={() => createAndMarkPaid(bracket.id, member.user_id)}
                            className="text-xs font-semibold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full hover:bg-yellow-500/20 transition-colors"
                          >
                            Mark Paid
                          </button>
                        </div>
                      )
                    }

                    return (
                      <div key={bracket.id} className="flex items-center justify-between text-sm py-1">
                        <span className="text-brand-muted text-xs">
                          {bracketLabel} — {formatCurrency(Number(payment.amount) || entryFee)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {payment.status === 'paid' ? (
                            <button
                              onClick={() => updatePaymentStatus(payment.id, 'unpaid')}
                              className="text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full hover:bg-green-500/20 transition-colors"
                            >
                              ✅ Paid
                            </button>
                          ) : payment.status === 'pending_verification' ? (
                            <>
                              <span className="text-xs text-yellow-400">Claimed</span>
                              <button
                                onClick={() => updatePaymentStatus(payment.id, 'paid')}
                                className="text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full hover:bg-green-500/20 transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => updatePaymentStatus(payment.id, 'unpaid')}
                                className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full hover:bg-red-500/20 transition-colors"
                              >
                                Dispute
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => updatePaymentStatus(payment.id, 'paid')}
                              className="text-xs font-semibold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full hover:bg-yellow-500/20 transition-colors"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
