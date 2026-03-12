/**
 * Upstash Redis caching layer with graceful fallback.
 * If UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set,
 * caching is skipped and the fetcher is called directly — no crashes.
 */
import { Redis } from '@upstash/redis'

// Track cache hit/miss stats (per process, reset on redeploy)
const cacheStats = {
  hits: 0,
  misses: 0,
  errors: 0,
  startedAt: new Date().toISOString(),
}

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    // Only warn once
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[cache] Upstash Redis not configured — caching disabled. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable.')
    }
    return null
  }
  redis = new Redis({ url, token })
  return redis
}

/**
 * Get a cached value, or fetch it and cache the result.
 * Falls back to calling fetcher() directly if Redis is not configured.
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  const client = getRedis()
  if (!client) {
    return fetcher()
  }

  try {
    const cached = await client.get<T>(key)
    if (cached !== null && cached !== undefined) {
      cacheStats.hits++
      return cached
    }
  } catch (err) {
    cacheStats.errors++
    console.warn('[cache] Redis get error for key', key, '—', err)
    // Fall through to fetcher
  }

  cacheStats.misses++
  const data = await fetcher()

  try {
    await client.setex(key, ttlSeconds, data as Parameters<typeof client.setex>[2])
  } catch (err) {
    console.warn('[cache] Redis setex error for key', key, '—', err)
    // Non-fatal — return data anyway
  }

  return data
}

/**
 * Delete a cache key (or a specific key pattern).
 * Safe to call even if Redis is not configured.
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  const client = getRedis()
  if (!client || keys.length === 0) return
  try {
    await client.del(...keys)
  } catch (err) {
    console.warn('[cache] Redis del error for keys', keys, '—', err)
  }
}

/**
 * Get cache hit/miss stats for monitoring.
 */
export function getCacheStats() {
  const client = getRedis()
  return {
    enabled: !!client,
    ...cacheStats,
    hitRate: cacheStats.hits + cacheStats.misses > 0
      ? Math.round((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100)
      : null,
  }
}

export { redis as redisClient }
