import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Nav from '@/components/layout/Nav'
import AchievementsGrid from './AchievementsGrid'
import type { Profile } from '@/types/database'

export const metadata = { title: 'Achievements · UFSL' }

export default async function AchievementsPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle()

  const profile = profileRaw as Profile | null

  // Fetch all achievements + user's unlocked ones
  const [allRes, userRes] = await Promise.all([
    supabase.from('achievements').select('*').eq('hidden', false).order('category').order('points', { ascending: false }),
    supabase.from('user_achievements').select('*').eq('user_id', session.user.id),
  ])

  const all = allRes.data ?? []
  const unlocked = userRes.data ?? []
  const unlockedMap = new Map(unlocked.map((u: any) => [u.achievement_id, u]))

  const achievements = all.map((a: any) => ({
    ...a,
    unlocked: unlockedMap.has(a.id),
    unlocked_at: (unlockedMap.get(a.id) as any)?.unlocked_at ?? null,
    metadata: (unlockedMap.get(a.id) as any)?.metadata ?? null,
  }))

  const totalPoints = unlocked.reduce((sum: number, ua: any) => {
    const def = all.find((a: any) => a.id === ua.achievement_id)
    return sum + (def?.points ?? 0)
  }, 0)

  return (
    <div className="min-h-screen bg-brand-dark">
      <Nav profile={profile} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <AchievementsGrid
          achievements={achievements}
          totalPoints={totalPoints}
          totalCount={all.length}
          unlockedCount={unlocked.length}
        />
      </main>
    </div>
  )
}
