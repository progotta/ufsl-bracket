import { PAYPAL_CONFIGURED, getPayPalAccessToken, PAYPAL_BASE } from '@/lib/paypal'
import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'

// GET /api/paypal/connect?pool_id=xxx
// Redirects commissioner to PayPal onboarding via Partner Referrals API
export async function GET(req: Request) {
  if (!PAYPAL_CONFIGURED) {
    return NextResponse.json({ error: 'PayPal not configured' }, { status: 503 })
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

  // Verify commissioner
  const { data: pool } = await supabase
    .from('pools')
    .select('commissioner_id')
    .eq('id', poolId)
    .single()

  if (!pool || pool.commissioner_id !== session.user.id) {
    return NextResponse.json({ error: 'Only the commissioner can connect PayPal' }, { status: 403 })
  }

  const token = await getPayPalAccessToken()
  if (!token) {
    return NextResponse.json({ error: 'Failed to get PayPal access token' }, { status: 500 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ufsl.net'

  const res = await fetch(`${PAYPAL_BASE}/v2/customer/partner-referrals`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tracking_id: `${session.user.id}-${Date.now()}`,
      partner_config_override: {
        return_url: `${siteUrl}/api/paypal/connect/callback?pool_id=${poolId}&user_id=${session.user.id}`,
      },
      operations: [{
        operation: 'API_INTEGRATION',
        api_integration_preference: {
          rest_api_integration: {
            integration_method: 'PAYPAL',
            integration_type: 'THIRD_PARTY',
            third_party_details: { features: ['PAYMENT', 'REFUND'] },
          },
        },
      }],
      products: ['EXPRESS_CHECKOUT'],
      legal_consents: [{ type: 'SHARE_DATA_CONSENT', granted: true }],
    }),
  })

  const data = await res.json()
  const actionUrl = data.links?.find((l: any) => l.rel === 'action_url')?.href
  if (!actionUrl) {
    return NextResponse.json({ error: 'Failed to create PayPal onboarding link' }, { status: 500 })
  }

  return NextResponse.redirect(actionUrl)
}
