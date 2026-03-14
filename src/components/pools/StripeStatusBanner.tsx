'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

export default function StripeStatusBanner() {
  const searchParams = useSearchParams()
  const paymentStatus = searchParams.get('payment')
  const stripeStatus = searchParams.get('stripe')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (paymentStatus || stripeStatus) {
      setVisible(true)
      const timer = setTimeout(() => setVisible(false), 6000)
      return () => clearTimeout(timer)
    }
  }, [paymentStatus, stripeStatus])

  if (!visible) return null

  if (paymentStatus === 'success') {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
        <CheckCircle size={20} className="text-green-400 shrink-0" />
        <p className="text-sm font-medium text-green-400">Payment received! You&apos;re officially in.</p>
      </div>
    )
  }

  if (paymentStatus === 'cancelled') {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
        <XCircle size={20} className="text-yellow-400 shrink-0" />
        <p className="text-sm font-medium text-yellow-400">Payment cancelled — you can try again anytime.</p>
      </div>
    )
  }

  if (stripeStatus === 'connected') {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
        <CheckCircle size={20} className="text-green-400 shrink-0" />
        <p className="text-sm font-medium text-green-400">Stripe connected! Members can now pay their entry fee directly.</p>
      </div>
    )
  }

  if (stripeStatus === 'refresh') {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
        <XCircle size={20} className="text-yellow-400 shrink-0" />
        <p className="text-sm font-medium text-yellow-400">Stripe setup expired — please try connecting again.</p>
      </div>
    )
  }

  return null
}
