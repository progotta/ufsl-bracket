import { getStripe } from '@/lib/stripe'
import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'

// GET /api/stripe/connect?pool_id=xxx
// Redirects commissioner to Stripe Express onboarding
export async function GET(req: Request) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const { searchParams } = new URL(req.url)
  const poolId = searchParams.get('pool_id')
  if (!poolId) {
    return NextResponse.json({ error: 'pool_id required' }, { status: 400 })
  }

  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user is commissioner of this pool
  const { data: pool } = await supabase
    .from('pools')
    .select('commissioner_id')
    .eq('id', poolId)
    .single()

  if (!pool || pool.commissioner_id !== session.user.id) {
    return NextResponse.json({ error: 'Only the commissioner can connect Stripe' }, { status: 403 })
  }

  // Check if they already have a Stripe account
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', session.user.id)
    .single()

  let accountId = profile?.stripe_account_id

  if (!accountId) {
    // Create new Stripe Connect Express account
    const account = await stripe.accounts.create({ type: 'express' })
    accountId = account.id

    // Store account ID immediately
    await supabase
      .from('profiles')
      .update({ stripe_account_id: accountId })
      .eq('id', session.user.id)
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ufsl.net'

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${siteUrl}/pools/${poolId}?stripe=refresh`,
    return_url: `${siteUrl}/api/stripe/connect/callback?pool_id=${poolId}`,
    type: 'account_onboarding',
  })

  return NextResponse.redirect(accountLink.url)
}
