import Stripe from 'stripe'

// Graceful: return null if not configured
export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
  })
}

export const STRIPE_CONFIGURED = !!process.env.STRIPE_SECRET_KEY
