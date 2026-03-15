import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/layout/Nav'
import ProfileForm from '@/components/profile/ProfileForm'
import ProfileAchievements from '@/components/achievements/ProfileAchievements'
import AchievementsPanel from '@/components/achievements/AchievementsPanel'

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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black">Your Profile</h1>
          <Link
            href="/profile/notifications"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-card border border-brand-border text-sm text-brand-muted hover:text-white hover:border-brand-orange/50 transition-all"
          >
            Notification Settings
          </Link>
        </div>
        <AchievementsPanel userId={session.user.id} />
        <ProfileAchievements userId={session.user.id} />
        <ProfileForm profile={profile} userId={session.user.id} />
      </main>
    </div>
  )
}
