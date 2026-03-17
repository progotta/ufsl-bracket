import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Nav from '@/components/layout/Nav'
import ConnectedAccountsManager from '@/components/profile/ConnectedAccountsManager'

export const metadata = {
  title: 'Connected Accounts | UFSL',
}

export default async function ConnectedAccountsPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return (
    <div className="min-h-screen bg-brand-dark">
      <Nav profile={profile} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-black">Connected Accounts</h1>
          <p className="text-brand-muted mt-1">
            Manage how you sign in. Link multiple methods so you never lose access.
          </p>
        </div>
        <ConnectedAccountsManager />
      </main>
    </div>
  )
}
