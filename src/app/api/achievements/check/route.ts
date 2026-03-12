import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { checkAchievements, type AchievementEvent, type AchievementContext } from '@/lib/achievements'

/**
 * POST /api/achievements/check
 * Body: { event: AchievementEvent, context: AchievementContext }
 *
 * Requires authenticated session. Awards achievements for the current user.
 * Returns list of newly-unlocked achievement IDs.
 */
export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { event: AchievementEvent; context?: AchievementContext }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { event, context = {} } = body

  if (!event) {
    return NextResponse.json({ error: 'event required' }, { status: 400 })
  }

  const unlocked = await checkAchievements(session.user.id, event, context)

  // Fetch full achievement details for newly-unlocked ones
  let newAchievements: any[] = []
  if (unlocked.length > 0) {
    const { data } = await supabase
      .from('achievements')
      .select('*')
      .in('id', unlocked)
    newAchievements = data ?? []
  }

  return NextResponse.json({ unlocked, achievements: newAchievements })
}
