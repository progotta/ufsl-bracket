import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Nav from '@/components/layout/Nav'
import ProfileForm from '@/components/profile/ProfileForm'

export default async function ProfilePage() {
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
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-black mb-8">Your Profile</h1>
        <ProfileForm profile={profile} userId={session.user.id} />
      </main>
    </div>
  )
}
