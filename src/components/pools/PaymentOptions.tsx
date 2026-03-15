'use client'

import { useState } from 'react'
import { CreditCard, Copy, Check, Loader2 } from 'lucide-react'
import PayWithStripe from './PayWithStripe'
import dynamic from 'next/dynamic'

const PayPalPayButton = dynamic(() => import('./PayPalPayButton'), { ssr: false })

interface PaymentMethod {
  type: 'stripe' | 'paypal' | 'manual'
  platform?: string
  handle?: string
  link?: string
  instructions?: string
}

interface Props {
  poolId: string
  entryFee: number
  paymentMethods: PaymentMethod[]
  commissionerStripeReady: boolean
  commissionerPaypalReady: boolean
  memberId: string
}

export default function PaymentOptions({
  poolId,
  entryFee,
  paymentMethods,
  commissionerStripeReady,
  commissionerPaypalReady,
  memberId,
}: Props) {
  const [markingPaid, setMarkingPaid] = useState(false)
  const [markedPaid, setMarkedPaid] = useState(false)
  const [copied, setCopied] = useState(false)

  const hasStripe = paymentMethods.some(m => m.type === 'stripe') && commissionerStripeReady
  const hasPaypal = paymentMethods.some(m => m.type === 'paypal') && commissionerPaypalReady
  const manualMethod = paymentMethods.find(m => m.type === 'manual')

  const handleIvePaid = async () => {
    setMarkingPaid(true)
    try {
      const res = await fetch(`/api/pools/${poolId}/members/${memberId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending_verification', note: `Self-reported via ${manualMethod?.platform || 'manual'}` }),
      })
      if (res.ok) setMarkedPaid(true)
    } catch {
      // silent
    } finally {
      setMarkingPaid(false)
    }
  }

  const copyHandle = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (markedPaid) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
        <span className="text-xl">&#9203;</span>
        <div>
          <p className="font-bold text-sm text-yellow-400">Pending Verification</p>
          <p className="text-xs text-brand-muted mt-0.5">The commissioner will confirm your payment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-bold text-sm">Pay Entry Fee</p>
          <p className="text-xs text-brand-muted mt-0.5">Pay ${entryFee} to lock in your spot</p>
        </div>
        <span className="text-xl font-black text-brand-orange">${entryFee}</span>
      </div>

      <div className="space-y-3">
        {/* Stripe */}
        {hasStripe && (
          <div className="p-3 bg-brand-card rounded-xl border border-brand-border">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={16} className="text-brand-orange" />
              <span className="text-sm font-semibold">Card / Apple Pay / Google Pay</span>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full ml-auto">Auto-verified</span>
            </div>
            <PayWithStripe poolId={poolId} entryFee={entryFee} />
          </div>
        )}

        {/* PayPal */}
        {hasPaypal && (
          <div className="p-3 bg-brand-card rounded-xl border border-brand-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">&#127359;&#65039;</span>
              <span className="text-sm font-semibold">PayPal</span>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full ml-auto">Auto-verified</span>
            </div>
            <PayPalPayButton
              poolId={poolId}
              amount={entryFee}
              onSuccess={() => window.location.reload()}
            />
          </div>
        )}

        {/* Manual payment method (if configured) */}
        {manualMethod && (
          <div className="p-3 bg-brand-card rounded-xl border border-brand-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">&#128241;</span>
              <span className="text-sm font-semibold">{manualMethod.platform || 'Other'}</span>
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full ml-auto">Manual</span>
            </div>
            <div className="space-y-2">
              {manualMethod.handle && (
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-brand-surface px-2 py-1 rounded flex-1">{manualMethod.handle}</code>
                  <button
                    onClick={() => copyHandle(manualMethod.handle!)}
                    className="text-brand-muted hover:text-white transition-colors p-1"
                  >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                </div>
              )}
              {manualMethod.link && (
                <a
                  href={manualMethod.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:underline block"
                >
                  Open {manualMethod.platform || 'payment link'} &rarr;
                </a>
              )}
              {manualMethod.instructions && (
                <p className="text-xs text-brand-muted">{manualMethod.instructions}</p>
              )}
            </div>
          </div>
        )}

        {/* "I've Paid" fallback — always shown when entry fee > 0 */}
        {!hasStripe && !hasPaypal && (
          <div className="p-3 bg-brand-card rounded-xl border border-brand-border">
            {!manualMethod && (
              <p className="text-xs text-brand-muted mb-3">Pay the commissioner directly (Venmo, Cash App, Zelle, cash, etc.), then tap below to notify them.</p>
            )}
            <button
              onClick={handleIvePaid}
              disabled={markingPaid}
              className="w-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-yellow-500/20 transition-colors flex items-center justify-center gap-2"
            >
              {markingPaid ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <Check size={14} />
                  I&apos;ve Paid — Notify Commissioner
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
