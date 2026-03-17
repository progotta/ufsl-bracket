import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
// Note: createServerClient wraps the SSR client; getSession() uses cookie auth

/**
 * GET /api/achievements/user/[userId]
 * Returns all achievements with unlock status + XP/level info for a user.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [allRes, userRes, xpRes] = await Promise.all([
    supabase.from('achievements').select('*').order('category').order('points', { ascending: false }),
    supabase.from('user_achievements').select('*').eq('user_id', userId),
    supabase.from('user_xp').select('*').eq('user_id', userId).maybeSingle(),
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

  // Calculate XP from achievements if user_xp row doesn't exist yet
  const totalXp = xpRes.data?.total_xp ?? unlocked.reduce((sum: number, ua: any) => {
    const def = all.find((a: any) => a.id === ua.achievement_id)
    return sum + (def?.xp_value ?? def?.points ?? 0)
  }, 0)

  const level = xpRes.data?.level ?? calculateLevel(totalXp)

  return NextResponse.json({
    achievements,
    totalXp,
    level,
    totalPoints: totalXp,
    unlockedCount: unlocked.length,
    totalCount: all.length,
  })
}

function calculateLevel(xp: number): number {
  if (xp >= 2000) return 5
  if (xp >= 1000) return 4
  if (xp >= 500) return 3
  if (xp >= 200) return 2
  return 1
}
