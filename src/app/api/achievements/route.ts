import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  const [allRes, userRes] = await Promise.all([
    supabase.from('achievements').select('*').order('category').order('points', { ascending: false }),
    supabase.from('user_achievements').select('*').eq('user_id', userId),
  ])

  if (allRes.error) {
    return NextResponse.json({ error: allRes.error.message }, { status: 500 })
  }

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

  return NextResponse.json({ achievements, totalPoints })
}
