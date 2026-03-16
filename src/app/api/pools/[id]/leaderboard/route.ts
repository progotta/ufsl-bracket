import { createServiceClient } from '@/lib/supabase/server'
import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const authClient = createRouteClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  // Verify the user is a member or commissioner
  const { data: membership } = await db
    .from('pool_members')
    .select('id')
    .eq('pool_id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) {
    const { data: pool } = await db
      .from('pools')
      .select('commissioner_id, is_public')
      .eq('id', params.id)
      .maybeSingle()
    if (!pool?.is_public && pool?.commissioner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { data } = await db
    .from('leaderboard')
    .select('*')
    .eq('pool_id', params.id)
    .order('rank', { ascending: true })

  return NextResponse.json({ leaderboard: data || [] })
}
