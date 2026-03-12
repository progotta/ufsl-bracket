/**
 * Rate limiting helper using @upstash/ratelimit.
 * Gracefully no-ops if UPSTASH_REDIS_REST_URL is not set,
 * so the app works before Upstash is configured.
 */
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

type RateLimitWindow = {
  requests: number
  window: `${number} s` | `${number} m` | `${number} h`
}

const limiters = new Map<string, Ratelimit>()

function getLimiter(prefix: string, config: RateLimitWindow): Ratelimit | null {
  const client = getRedis()
  if (!client) return null

  const key = `${prefix}:${config.requests}:${config.window}`
  if (limiters.has(key)) return limiters.get(key)!

  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    prefix: `rl:${prefix}`,
  })
  limiters.set(key, limiter)
  return limiter
}

/**
 * Check rate limit for an identifier (userId, IP, etc).
 * Returns null if allowed (or if Redis is not configured).
 * Returns a 429 NextResponse if rate limited.
 */
export async function rateLimit(
  identifier: string,
  prefix: string,
  config: RateLimitWindow,
): Promise<NextResponse | null> {
  const limiter = getLimiter(prefix, config)
  if (!limiter) return null // no-op when Redis not configured

  try {
    const result = await limiter.limit(identifier)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(result.reset),
          },
        },
      )
    }
  } catch (err) {
    // If Redis is down, allow the request through
    console.warn('[ratelimit] Error checking rate limit:', err)
  }

  return null
}
