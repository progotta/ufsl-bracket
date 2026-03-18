'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PayNowModal from './PayNowModal'

interface Props {
  poolId: string
  memberId: string
  entryFee: number
  bracketsOwed: number
  venmoHandle: string | null
  paymentInstructions: string | null
  paymentStatus: string
}

export default function PayNowButton({
  poolId,
  memberId,
  entryFee,
  bracketsOwed,
  venmoHandle,
  paymentInstructions,
  paymentStatus,
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
        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-brand-orange text-white hover:opacity-90 transition-opacity"
      >
        Pay Now
      </button>
      {open && (
        <PayNowModal
          poolId={poolId}
          memberId={memberId}
          entryFee={entryFee}
          bracketsOwed={bracketsOwed}
          venmoHandle={venmoHandle}
          paymentInstructions={paymentInstructions}
          onClose={() => setOpen(false)}
          onPaid={() => router.refresh()}
        />
      )}
    </>
  )
}
