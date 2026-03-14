'use client'

import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { useState } from 'react'

interface Props {
  poolId: string
  amount: number
  onSuccess: () => void
}

export default function PayPalPayButton({ poolId, amount, onSuccess }: Props) {
  const [error, setError] = useState<string | null>(null)
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

  if (!clientId) return null

  return (
    <PayPalScriptProvider options={{ clientId, currency: 'USD' }}>
      <div className="w-full">
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
        <PayPalButtons
          style={{ layout: 'horizontal', color: 'blue', shape: 'rect', label: 'pay' }}
          createOrder={async () => {
            const res = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pool_id: poolId }),
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            return data.orderID
          }}
          onApprove={async (data) => {
            const res = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderID: data.orderID, pool_id: poolId }),
            })
            const result = await res.json()
            if (result.success) onSuccess()
            else setError('Payment failed — please try again')
          }}
          onError={() => setError('PayPal error — please try again or use a different method')}
        />
      </div>
    </PayPalScriptProvider>
  )
}
