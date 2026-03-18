import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCached } from '@/lib/cache'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  const result = await getCached(`achievements:${userId}`, async () => {
    const supabase = createServerClient()

    const [allRes, userRes] = await Promise.all([
      supabase.from('achievements').select('*').eq('hidden', false).order('category').order('points', { ascending: false }),
      supabase.from('user_achievements').select('*').eq('user_id', userId),
    ])

    if (allRes.error) throw new Error(allRes.error.message)

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

    return { achievements, totalPoints }
  }, 120)

  return NextResponse.json(result)
}
