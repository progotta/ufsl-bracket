/**
 * Admin endpoint: cache hit/miss stats + Redis health check.
 * GET /api/admin/cache-stats
 *
 * Protected: commissioners only.
 */
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { getCacheStats, redisClient } from '@/lib/cache'
import { isCacheValid, getCache } from '@/lib/liveScores'

export async function GET() {
  const authError = await requireAdmin()
  if (authError) return authError


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
