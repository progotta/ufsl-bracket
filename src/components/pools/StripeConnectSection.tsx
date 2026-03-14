'use client'

import { ExternalLink, CreditCard, CheckCircle, RefreshCw } from 'lucide-react'

interface Props {
  poolId: string
  stripeOnboarded: boolean
  stripeAccountId: string | null
}

export default function StripeConnectSection({ poolId, stripeOnboarded, stripeAccountId }: Props) {
  if (stripeOnboarded && stripeAccountId) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <CheckCircle size={20} className="text-green-400" />
          <div className="flex-1">
            <p className="font-bold text-sm text-green-400">Stripe Connected</p>
            <p className="text-xs text-brand-muted mt-0.5">
              Members can pay their entry fee directly by card — auto-tracked, no chasing.
            </p>
          </div>
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-muted hover:text-white flex items-center gap-1 transition-colors"
          >
            Dashboard <ExternalLink size={12} />
          </a>
        </div>
      </div>
    )
  }

  if (stripeAccountId && !stripeOnboarded) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <RefreshCw size={20} className="text-yellow-400" />
          <div className="flex-1">
            <p className="font-bold text-sm text-yellow-400">Finish Stripe Setup</p>
            <p className="text-xs text-brand-muted mt-0.5">
              You started connecting Stripe but didn&apos;t finish. Complete setup to accept payments.
            </p>
          </div>
          <a
            href={`/api/stripe/connect?pool_id=${poolId}`}
            className="bg-yellow-500 text-black font-bold text-sm px-4 py-2 rounded-xl hover:bg-yellow-400 transition-colors"
          >
            Finish Setup
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="bg-brand-orange/10 rounded-xl p-2.5">
          <CreditCard size={20} className="text-brand-orange" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">Connect Stripe to Auto-Collect Payments</p>
          <p className="text-xs text-brand-muted mt-0.5">
            Members pay by card, you get the money directly. No more chasing people.
          </p>
        </div>
        <a
          href={`/api/stripe/connect?pool_id=${poolId}`}
          className="bg-brand-orange text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-brand-orange/90 transition-colors whitespace-nowrap"
        >
          Connect Stripe
        </a>
      </div>
    </div>
  )
}
