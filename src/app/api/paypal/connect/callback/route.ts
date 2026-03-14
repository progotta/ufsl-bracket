import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// PayPal redirects here after onboarding with merchantId + merchantIdInPayPal
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const merchantId = searchParams.get('merchantIdInPayPal')
  const userId = searchParams.get('user_id')
  const poolId = searchParams.get('pool_id')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ufsl.net'

  if (merchantId && userId) {
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
