import { createServiceClient } from '@/lib/supabase/server'
import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const authClient = createRouteClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify membership
  const db = createServiceClient()
  const { data: membership } = await db.from('pool_members')
    .select('id').eq('pool_id', params.id).eq('user_id', user.id).single()
  if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const { data: members } = await db
    .from('pool_members')
    .select('*, profiles(display_name, avatar_url)')
    .eq('pool_id', params.id)

  return NextResponse.json({ members: members || [] })
}
