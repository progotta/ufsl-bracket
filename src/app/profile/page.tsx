import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Nav from '@/components/layout/Nav'
import ProfileForm from '@/components/profile/ProfileForm'
import ProfileAchievements from '@/components/achievements/ProfileAchievements'
import AchievementsPanel from '@/components/achievements/AchievementsPanel'
import XPBar from '@/components/achievements/XPBar'

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
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <h1 className="text-3xl font-black">Your Profile</h1>
        <XPBar userId={session.user.id} />
        <AchievementsPanel userId={session.user.id} />
        <ProfileAchievements userId={session.user.id} />
        <ProfileForm profile={profile} userId={session.user.id} />
      </main>
    </div>
  )
}
