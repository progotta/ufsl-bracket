/**
 * Admin endpoint: cache hit/miss stats + Redis health check.
 * GET /api/admin/cache-stats
 *
 * Protected: commissioners only.
 */
import { NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route'
import { getCacheStats, redisClient } from '@/lib/cache'
import { isCacheValid, getCache } from '@/lib/liveScores'

export async function GET() {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check commissioner access
  const db = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any
  const { data: membership } = await db
    .from('pool_members')
    .select('role')
    .eq('user_id', session.user.id)
    .eq('role', 'commissioner')
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden — commissioners only' }, { status: 403 })
  }

  // Collect stats
  const stats = getCacheStats()

  // In-memory live scores cache status
  const liveScoresCacheValid = isCacheValid()
  const liveScoresCache = getCache()

  // Redis ping
  let redisPingMs: number | null = null
  let redisError: string | null = null
  if (redisClient) {
    try {
      const start = Date.now()
      await redisClient.ping()
      redisPingMs = Date.now() - start
    } catch (err) {
      redisError = String(err)
    }
  }

  return NextResponse.json({
    redis: {
      enabled: stats.enabled,
      pingMs: redisPingMs,
      error: redisError,
    },
    stats: {
      hits: stats.hits,
      misses: stats.misses,
      errors: stats.errors,
      hitRate: stats.hitRate !== null ? `${stats.hitRate}%` : null,
      upSince: stats.startedAt,
    },
    liveScores: {
      inMemoryCacheValid: liveScoresCacheValid,
      cachedUntil: liveScoresCache?.cachedUntil ?? null,
      source: liveScoresCache?.source ?? null,
      gameCount: liveScoresCache?.games?.length ?? 0,
    },
    cacheKeys: {
      liveScores: 'live-scores',
      globalLeaderboard: 'leaderboard:global:{filter}',
      poolLeaderboard: 'leaderboard:pool:{poolId}',
      teams: 'teams:active',
    },
  })
}
