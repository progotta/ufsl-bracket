'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/payouts'

interface PaymentToggleProps {
  memberId: string
  status: 'unpaid' | 'paid' | 'waived' | 'pending_verification'
  poolId: string
  fee: number
  memberName?: string
}

export default function PaymentToggle({ memberId, status, poolId, fee, memberName }: PaymentToggleProps) {
  const [currentStatus, setCurrentStatus] = useState(status)
  const [loading, setLoading] = useState(false)

  const updateStatus = async (newStatus: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/pools/${poolId}/members/${memberId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setCurrentStatus(newStatus as any)
      }
    } catch {
      // silent fail — state stays the same
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <span className="text-xs text-brand-muted px-3 py-1.5">
        <Loader2 size={14} className="animate-spin inline" />
      </span>
    )
  }

  if (currentStatus === 'paid') {
    return (
      <button
        onClick={() => updateStatus('unpaid')}
        className="text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full hover:bg-green-500/20 transition-colors"
      >
        ✅ Paid
      </button>
    )
  }

  if (currentStatus === 'pending_verification') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-yellow-400">{memberName || 'Member'} says paid</span>
        <button
          onClick={() => updateStatus('paid')}
          className="text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full hover:bg-green-500/20 transition-colors"
        >
          ✅ Confirm
        </button>
        <button
          onClick={() => updateStatus('unpaid')}
          className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full hover:bg-red-500/20 transition-colors"
        >
          ✕ Dispute
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => updateStatus('paid')}
      className="text-xs font-semibold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-full hover:bg-yellow-500/20 transition-colors"
    >
      {formatCurrency(fee)} owed
    </button>
  )
}
