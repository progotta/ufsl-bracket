import { NextResponse } from 'next/server'
import { createServerClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createServiceClient()
  const { data, error } = await admin.auth.admin.getUserById(user.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const identities = (data.user?.identities ?? []).map((identity) => ({
    id: identity.id,
    provider: identity.provider,
    provider_id:
      identity.identity_data?.email ||
      identity.identity_data?.phone ||
      identity.identity_data?.sub ||
      identity.id,
    email: identity.identity_data?.email as string | undefined,
    phone: identity.identity_data?.phone as string | undefined,
    created_at: identity.created_at,
  }))

  return NextResponse.json(identities)
}
