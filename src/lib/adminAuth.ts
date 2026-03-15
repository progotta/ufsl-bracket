/**
 * Admin authentication helper.
 *
 * Admin access requires:
 *   1. A valid Supabase session (logged-in user)
 *   2. The user's ID appears in ADMIN_USER_IDS env var
 *      (comma-separated list, e.g. "uuid1,uuid2")
 *
 * Usage in an API route:
 *   const authError = await requireAdmin(request)
 *   if (authError) return authError
 */
import { createRouteClient } from '@/lib/supabase/route'
import { NextResponse } from 'next/server'

export async function requireAdmin(): Promise<NextResponse | null> {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminIds = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean)

  // If no admin IDs are configured, block access in all environments except local development.
  // L-1: Restrict bypass to localhost only — preview/staging deployments without ADMIN_USER_IDS
  // set should NOT grant admin access to all logged-in users. The check below ensures the bypass
  // only fires when running on a local machine (NODE_ENV=development AND site URL contains localhost).
  if (adminIds.length === 0) {
    const isLocalDev =
      process.env.NODE_ENV === 'development' &&
      (process.env.NEXT_PUBLIC_SITE_URL || '').includes('localhost')

    if (!isLocalDev) {
      return NextResponse.json({ error: 'Admin access not configured' }, { status: 403 })
    }
    // Local dev only: log a warning but allow through so developers can test admin features
    console.warn('[adminAuth] ADMIN_USER_IDS is not set — admin routes are unprotected on localhost dev')
    return null
  }

  if (!adminIds.includes(session.user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return null // access granted
}
