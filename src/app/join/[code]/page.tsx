import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import JoinPoolForm from '@/components/pools/JoinPoolForm'
import Nav from '@/components/layout/Nav'

interface Props {
  params: { code: string }
}

export default async function JoinPage({ params }: Props) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect(`/auth?next=/join/${params.code}`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const { data: pool } = await supabase
    .from('pools')
    .select('*')
    .eq('invite_code', params.code.toUpperCase())
    .single()

  if (!pool) {
    return (
      <div className="min-h-screen bg-brand-dark">
        <Nav profile={profile} />
        <main className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-2">Invalid Invite Code</h1>
          <p className="text-brand-muted mb-6">That invite code doesn't match any pool.</p>
          <a href="/dashboard" className="btn-primary inline-block">Go to Dashboard</a>
        </main>
      </div>
    )
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('pool_members')
    .select('id')
    .eq('pool_id', pool.id)
    .eq('user_id', session.user.id)
    .single()

  if (existing) {
    redirect(`/pools/${pool.id}`)
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <Nav profile={profile} />
      <main className="max-w-lg mx-auto px-4 py-12">
        <JoinPoolForm pool={pool} userId={session.user.id} />
      </main>
    </div>
  )
}
