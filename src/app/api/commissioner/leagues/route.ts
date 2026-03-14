import { createRouteClient } from '@/lib/supabase/route'
import { createReadClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminDb = createReadClient()

  // Get all pools where user is commissioner
  const { data: pools, error } = await adminDb
    .from('pools')
    .select('*')
    .eq('commissioner_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // For each pool, get member count, submitted count, paid count
  const enriched = await Promise.all(
    (pools || []).map(async (pool) => {
      const { count: memberCount } = await adminDb
        .from('pool_members')
        .select('*', { count: 'exact', head: true })
        .eq('pool_id', pool.id)

      const { count: submittedCount } = await adminDb
        .from('brackets')
        .select('*', { count: 'exact', head: true })
        .eq('pool_id', pool.id)
        .eq('is_submitted', true)

      const { count: paidCount } = await adminDb
        .from('pool_members')
        .select('*', { count: 'exact', head: true })
        .eq('pool_id', pool.id)
        .eq('payment_status', 'paid')

      return {
        ...pool,
        member_count: memberCount || 0,
        submitted_count: submittedCount || 0,
        paid_count: paidCount || 0,
      }
    })
  )

  return NextResponse.json({ leagues: enriched })
}
