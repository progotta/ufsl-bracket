/**
 * Achievement Checker Service
 *
 * Usage:
 *   import { checkAchievements } from '@/lib/achievements'
 *   await checkAchievements(userId, 'pick_correct', { gameId, round, seed })
 *
 * Idempotent — UNIQUE constraint on (user_id, achievement_id) prevents double-awards.
 */

import { createClient } from '@/lib/supabase/client'
import { createServerClient } from '@/lib/supabase/server'

export type AchievementEvent =
  | 'pick_correct'
  | 'pick_incorrect'
  | 'round_complete'
  | 'bracket_submitted'
  | 'pool_joined'
  | 'pool_won'
  | 'pool_second'
  | 'pool_busted_leader'
  | 'smack_sent'
  | 'smack_fire_reaction'
  | 'second_chance_won'

export interface AchievementContext {
  // pick context
  gameId?: string
  round?: number
  seed?: number         // winning team seed (for upset/cinderella checks)
  opponentSeed?: number // loser seed (to verify upset direction)
  correctPicksInRound?: number
  totalPicksInRound?: number
  correctStreak?: number

  // bracket submission context
  allFavoritesFinalFour?: boolean   // chalk master
  highSeedSixteenCount?: number     // chaos agent (double-digit seeds to sweet 16)

  // pool context
  poolId?: string
  poolsJoinedCount?: number

  // smack context
  smackSentCount?: number
  smackFireCount?: number

  // special
  isChampionPick?: boolean
  highSeedSixteenActual?: boolean  // cinderella: they actually made it
  bracketPickedSeed?: number        // what seed user picked for cinderella
}

export interface Achievement {
  id: string
  name: string
  description: string
  emoji: string
  category: 'picks' | 'social' | 'pools' | 'streaks' | 'special'
  points: number
  xp_value: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  secret: boolean
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
  metadata: Record<string, unknown>
  achievements?: Achievement
}

/**
 * Determine which achievements to check for a given event, then award.
 * Returns array of newly-unlocked achievement IDs.
 */
export async function checkAchievements(
  userId: string,
  event: AchievementEvent,
  context: AchievementContext = {},
  supabaseClient?: ReturnType<typeof createClient>
): Promise<string[]> {
  const supabase = supabaseClient ?? createServerClient()
  const toAward: { id: string; metadata: Record<string, unknown> }[] = []

  switch (event) {
    // ─── Bracket submitted ───────────────────────────────────────────────
    case 'bracket_submitted': {
      // ice_cold: first submission in pool
      if (context.poolId) {
        const { count } = await supabase
          .from('brackets')
          .select('id', { count: 'exact', head: true })
          .eq('pool_id', context.poolId)
          .eq('is_submitted', true)
          .neq('user_id', userId)
        if ((count ?? 0) === 0) {
          toAward.push({ id: 'ice_cold', metadata: { pool_id: context.poolId } })
        }
      }
      // chalk_master
      if (context.allFavoritesFinalFour) {
        toAward.push({ id: 'chalk_master', metadata: {} })
      }
      // chaos_agent: 4+ double-digit seeds picked to sweet 16
      if ((context.highSeedSixteenCount ?? 0) >= 4) {
        toAward.push({ id: 'chaos_agent', metadata: { count: context.highSeedSixteenCount } })
      }
      break
    }

    // ─── Individual correct pick ─────────────────────────────────────────
    case 'pick_correct': {
      const streak = context.correctStreak ?? 0
      const seed = context.seed ?? 0
      const oppSeed = context.opponentSeed ?? 0
      const isUpset = seed > oppSeed && seed >= 5 // winner was lower-seeded

      // on_fire: 5-game streak
      if (streak >= 5) {
        toAward.push({ id: 'on_fire', metadata: { streak } })
      }
      // lightning: 10-game streak
      if (streak >= 10) {
        toAward.push({ id: 'lightning', metadata: { streak } })
      }
      // cinderella: pick a 12+ seed to sweet 16 (round 3) and they made it
      if (context.round === 3 && seed >= 12 && context.highSeedSixteenActual) {
        toAward.push({ id: 'cinderella', metadata: { seed, game_id: context.gameId } })
      }
      // madness: picked the eventual champion
      if (context.isChampionPick && context.round === 6) {
        toAward.push({ id: 'madness', metadata: { game_id: context.gameId } })
      }
      break
    }

    // ─── Round complete ───────────────────────────────────────────────────
    case 'round_complete': {
      const correct = context.correctPicksInRound ?? 0
      const total = context.totalPicksInRound ?? 1

      // sharpshooter: 10+ correct in a round
      if (correct >= 10) {
        toAward.push({ id: 'sharpshooter', metadata: { correct, round: context.round } })
      }
      // flawless_round: perfect round
      if (correct === total && total > 0) {
        toAward.push({ id: 'flawless_round', metadata: { round: context.round, correct } })
      }
      // clown: worst accuracy in round — caller must verify externally
      // (this event is dispatched from scorer once standings are computed)

      // oracle: check cumulative upsets correct (requires context)
      // Handled server-side in scoring endpoint — pass correctUpsets in metadata
      break
    }

    // ─── Pool events ──────────────────────────────────────────────────────
    case 'pool_joined': {
      const count = context.poolsJoinedCount ?? 1
      if (count >= 3) {
        toAward.push({ id: 'social_butterfly', metadata: { count } })
      }
      break
    }

    case 'pool_won': {
      toAward.push({ id: 'champion', metadata: { pool_id: context.poolId } })
      // dynasty check handled separately with year-over-year logic
      break
    }

    case 'pool_second': {
      toAward.push({ id: 'so_close', metadata: { pool_id: context.poolId } })
      break
    }

    case 'pool_busted_leader': {
      toAward.push({ id: 'bracket_buster', metadata: { pool_id: context.poolId } })
      break
    }

    // ─── Social events ────────────────────────────────────────────────────
    case 'smack_sent': {
      const count = context.smackSentCount ?? 0
      if (count >= 10) {
        toAward.push({ id: 'trash_talker', metadata: { count } })
      }
      break
    }

    case 'smack_fire_reaction': {
      const count = context.smackFireCount ?? 0
      if (count >= 5) {
        toAward.push({ id: 'roaster', metadata: { count } })
      }
      break
    }

    // ─── Second chance ────────────────────────────────────────────────────
    case 'second_chance_won': {
      toAward.push({ id: 'second_chance', metadata: { pool_id: context.poolId } })
      break
    }
  }

  if (!toAward.length) return []

  // Bulk insert — ignore conflicts (idempotent)
  const rows = toAward.map(({ id, metadata }) => ({
    user_id: userId,
    achievement_id: id,
    metadata,
  }))

  // Use upsert with ignoreDuplicates to be idempotent
  const { data, error } = await supabase
    .from('user_achievements')
    .upsert(rows, { onConflict: 'user_id,achievement_id', ignoreDuplicates: true })
    .select('achievement_id')

  if (error) {
    // Ignore unique constraint violations; log others
    if (!error.message.includes('unique') && !error.message.includes('duplicate')) {
      console.error('[achievements] upsert error:', error)
    }
    return []
  }

  return (data ?? []).map((r: { achievement_id: string }) => r.achievement_id)
}

/**
 * Fetch all achievements with user unlock status.
 */
export async function getUserAchievements(userId: string) {
  const supabase = createServerClient()

  const [allRes, userRes] = await Promise.all([
    supabase.from('achievements').select('*').order('category').order('rarity'),
    supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId),
  ])

  const all: Achievement[] = allRes.data ?? []
  const unlocked: UserAchievement[] = userRes.data ?? []
  const unlockedMap = new Map(unlocked.map(u => [u.achievement_id, u]))

  return all.map(a => ({
    ...a,
    unlocked: unlockedMap.has(a.id),
    unlocked_at: unlockedMap.get(a.id)?.unlocked_at ?? null,
    metadata: unlockedMap.get(a.id)?.metadata ?? null,
  }))
}

/**
 * Get total achievement points for a user.
 */
export async function getUserAchievementPoints(userId: string): Promise<number> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('user_achievements')
    .select('achievements(points)')
    .eq('user_id', userId)

  if (!data) return 0
  return data.reduce((sum: number, row: any) => sum + (row.achievements?.points ?? 0), 0)
}

/**
 * Award the oracle achievement if user has 3+ correct upset picks.
 * Call this from the scoring/results pipeline.
 */
export async function checkOracleAchievement(userId: string) {
  const supabase = createServerClient()

  // Count correct upset picks (winner was higher seed than loser, i.e., lower-seeded team won)
  // This requires joining brackets.picks → games → teams — simplified here as a direct count
  // Actual implementation depends on picks schema; stubbed for integration
  const { count } = await supabase
    .from('user_achievements')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('achievement_id', 'oracle')

  if ((count ?? 0) > 0) return // already awarded

  // In real usage, compute correctUpsets from scoring data and call:
  // if (correctUpsets >= 3) await checkAchievements(userId, 'pick_correct', { ... })
}
