import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Nav from '@/components/layout/Nav'
import JoinByCodeForm from '@/components/pools/JoinByCodeForm'

export default async function JoinPage({ searchParams }: { searchParams: { pool?: string } }) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/auth?next=/join')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return (
    <div className="min-h-screen bg-brand-dark">
      <Nav profile={profile} />
      <main className="max-w-lg mx-auto px-4 py-12">
        <JoinByCodeForm />
      </main>
    </div>
  )
}
