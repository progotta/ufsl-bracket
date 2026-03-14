import { getStripe } from '@/lib/stripe'
import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'

// GET /api/stripe/connect/callback — Stripe redirects here after onboarding
export async function GET(req: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ufsl.net'
  const stripe = getStripe()
  if (!stripe) return NextResponse.redirect(`${siteUrl}/dashboard`)

  const { searchParams } = new URL(req.url)
  const poolId = searchParams.get('pool_id')

  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.redirect(`${siteUrl}/auth`)

  // Get their Stripe account ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', session.user.id)
    .single()

  if (profile?.stripe_account_id) {
    const account = await stripe.accounts.retrieve(profile.stripe_account_id)
    if (account.details_submitted) {
      await supabase
        .from('profiles')
        .update({ stripe_onboarded: true })
        .eq('id', session.user.id)
    }
  }

  const redirectUrl = poolId
    ? `${siteUrl}/pools/${poolId}?stripe=connected`
    : `${siteUrl}/dashboard?stripe=connected`

  return NextResponse.redirect(redirectUrl)
}
