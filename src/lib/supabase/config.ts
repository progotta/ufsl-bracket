/**
 * Supabase connection pooling configuration.
 *
 * For serverless environments (Vercel Edge / Lambda), each invocation may
 * open a new Postgres connection. PgBouncer (built into Supabase) pools
 * these connections server-side to avoid exhausting the connection limit.
 *
 * How to enable:
 * 1. In your Supabase dashboard → Settings → Database → Connection string
 *    copy the "Connection pooling" URL (port 6543, not 5432).
 * 2. Set SUPABASE_DB_URL to the pooler URL.
 * 3. Append `?pgbouncer=true` to signal Prisma / raw clients to use
 *    statement-level pooling (required with PgBouncer in transaction mode).
 *
 * Example .env:
 *   SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
 *
 * Note: The Supabase JS client (@supabase/supabase-js) connects over HTTPS
 * and handles its own connection management — this config mainly applies
 * to direct Postgres access via Prisma, drizzle, or pg.
 */

export const SUPABASE_POOL_CONFIG = {
  /** Max connections per serverless worker (keep low for pooled mode) */
  maxConnections: 1,
  /** Use pgbouncer transaction-mode pooling */
  pgbouncer: true,
  /** Connection string should use port 6543 (pooler) not 5432 (direct) */
  poolerPort: 6543,
  /** Direct connection port (for migrations — do NOT use in serverless) */
  directPort: 5432,
} as const

/**
 * Returns the database URL with pgbouncer flag appended.
 * Falls back gracefully if SUPABASE_DB_URL is not set.
 */
export function getPooledDatabaseUrl(): string | undefined {
  const url = process.env.SUPABASE_DB_URL
  if (!url) return undefined
  if (url.includes('pgbouncer=true')) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}pgbouncer=true`
}
