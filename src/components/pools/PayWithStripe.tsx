'use client'

import { useState } from 'react'
import { CreditCard } from 'lucide-react'

interface Props {
  poolId: string
  entryFee: number
}

export default function PayWithStripe({ poolId, entryFee }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pool_id: poolId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Payment failed')
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={loading}
        className="bg-brand-orange text-white font-bold px-4 py-2 rounded-xl hover:bg-brand-orange/90 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
      >
        <CreditCard size={16} />
        {loading ? 'Redirecting...' : `Pay $${entryFee} Entry Fee`}
      </button>
      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}
    </div>
  )
}
