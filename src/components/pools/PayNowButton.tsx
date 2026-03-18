'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PayNowModal from './PayNowModal'

interface Props {
  poolId: string
  memberId: string
  userId: string
  entryFee: number
  venmoHandle: string | null
  paymentInstructions: string | null
  paymentStatus: string
  amountOwed?: number
}

export default function PayNowButton({
  poolId,
  memberId,
  userId,
  entryFee,
  venmoHandle,
  paymentInstructions,
  paymentStatus,
  amountOwed,
}: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  if (paymentStatus === 'paid' || paymentStatus === 'waived') {
    return (
      <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
        Paid ✓
      </span>
    )
  }

  if (paymentStatus === 'pending_verification') {
    return (
      <span className="text-xs font-bold px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
        ⏳ Pending
      </span>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2.5 rounded-xl bg-brand-orange text-white text-sm font-bold hover:opacity-90 transition-opacity"
      >
        {amountOwed && amountOwed > 0 ? `Pay Now — $${amountOwed.toFixed(0)} owed` : 'Pay Now'}
      </button>
      {open && (
        <PayNowModal
          poolId={poolId}
          userId={userId}
          memberId={memberId}
          entryFee={entryFee}
          venmoHandle={venmoHandle}
          paymentInstructions={paymentInstructions}
          onClose={() => setOpen(false)}
          onAnyPaid={() => router.refresh()}
        />
      )}
    </>
  )
}
