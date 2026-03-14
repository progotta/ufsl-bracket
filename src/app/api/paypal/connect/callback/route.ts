import { createClient } from '@supabase/supabase-js'
import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'

// PayPal redirects here after onboarding with merchantId + merchantIdInPayPal
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const merchantId = searchParams.get('merchantIdInPayPal')
  const poolId = searchParams.get('pool_id')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ufsl.net'

  // Authenticate from session — never trust user_id from query params
  const supabaseAuth = createRouteClient()
  const { data: { session } } = await supabaseAuth.auth.getSession()

  if (!session) {
    return NextResponse.redirect(`${siteUrl}/auth?next=/pools/${poolId || ''}`)
  }

  const userId = session.user.id

  // Validate merchantId format (alphanumeric PayPal merchant IDs)
  const MERCHANT_ID_REGEX = /^[A-Z0-9]{10,20}$/
  if (merchantId && MERCHANT_ID_REGEX.test(merchantId)) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await supabase.from('profiles').update({
      paypal_merchant_id: merchantId,
      paypal_onboarded: true,
    } as any).eq('id', userId)
  }

  return NextResponse.redirect(`${siteUrl}/pools/${poolId}?paypal=connected`)
}
