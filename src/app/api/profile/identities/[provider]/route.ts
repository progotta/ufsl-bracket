import { NextResponse } from 'next/server'
import { createServerClient, createServiceClient } from '@/lib/supabase/server'

export async function DELETE(
  _req: Request,
  { params }: { params: { provider: string } }
) {
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

  const identities = data.user?.identities ?? []

  if (identities.length <= 1) {
    return NextResponse.json(
      { error: 'Cannot remove your last sign-in method. Add another before removing this one.' },
      { status: 400 }
    )
  }

  const identity = identities.find((i) => i.provider === params.provider)
  if (!identity) {
    return NextResponse.json({ error: 'Identity not found' }, { status: 404 })
  }

  // Use Supabase Admin REST API to delete the specific identity
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${user.id}/identities/${identity.id}`,
    {
      method: 'DELETE',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
    }
  )

  if (!res.ok) {
    const body = await res.text()
    return NextResponse.json({ error: body }, { status: res.status })
  }

  return NextResponse.json({ success: true })
}
