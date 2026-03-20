import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/', '/auth', '/join', '/privacy', '/terms', '/sms-consent', '/support']

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: req,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const isPublicRoute = publicRoutes.some(route =>
    req.nextUrl.pathname === route ||
    req.nextUrl.pathname.startsWith('/auth/') ||
    req.nextUrl.pathname.startsWith('/join/') ||
    req.nextUrl.pathname.startsWith('/api/public/') ||
    req.nextUrl.pathname.startsWith('/api/cron/') ||
    req.nextUrl.pathname.startsWith('/api/scores/')
  )

  // Redirect to auth if not logged in
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL('/auth', req.url)
    redirectUrl.searchParams.set('next', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if logged in and on auth page
  if (session && req.nextUrl.pathname === '/auth') {
    const next = req.nextUrl.searchParams.get('next') || '/dashboard'
    // Prevent open redirect: only allow relative paths (must start with /)
    const safePath = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
    return NextResponse.redirect(new URL(safePath, req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)'],
}
