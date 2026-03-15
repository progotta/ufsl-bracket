import { chromium, FullConfig } from '@playwright/test'
import * as fs from 'fs'

const PROJECT_REF = 'ymzyzrfxgypfhbrqqaob'
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltenl6cmZ4Z3lwZmhicnFxYW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNzQwOTksImV4cCI6MjA4ODk1MDA5OX0.AQSoQGwbtxDDVEpOHgZ09GcIaz3KnbN3cJvLceJ1Hf4'
const APP_URL = 'https://ufsl-bracket-test.vercel.app'
const AUTH_FILE = 'e2e/auth.json'

async function getSession() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pw-test@ufsl.net', password: 'PlaywrightTest123!' })
  })
  return res.json()
}

async function globalSetup(config: FullConfig) {
  // Skip if recent auth exists (< 50 min old)
  if (fs.existsSync(AUTH_FILE)) {
    const age = Date.now() - fs.statSync(AUTH_FILE).mtimeMs
    if (age < 50 * 60 * 1000) {
      console.log('Using cached auth state')
      return
    }
  }

  console.log('Fetching fresh session...')
  const session = await getSession()
  if (!session.access_token) throw new Error('Auth failed: ' + JSON.stringify(session))

  // Build cookie value (JSON of session)
  const cookieValue = JSON.stringify({
    access_token: session.access_token,
    token_type: session.token_type,
    expires_in: session.expires_in,
    expires_at: session.expires_at,
    refresh_token: session.refresh_token,
    user: session.user,
  })

  const cookieName = `sb-${PROJECT_REF}-auth-token`
  const browser = await chromium.launch()
  const context = await browser.newContext()

  // Visit app first to establish domain context
  await context.addCookies([{
    name: cookieName,
    value: cookieValue,
    domain: 'ufsl-bracket-test.vercel.app',
    path: '/',
    httpOnly: false,
    secure: true,
    sameSite: 'Lax',
  }])

  // Verify auth works by navigating to dashboard
  const page = await context.newPage()
  await page.goto(`${APP_URL}/dashboard`, { waitUntil: 'networkidle' })
  const url = page.url()
  console.log('After auth injection, landed on:', url)

  if (url.includes('/auth')) {
    // Cookie name might be different — try alternate format
    console.log('Cookie injection failed, trying alternate...')
    await context.clearCookies()
    // Some @supabase/ssr versions use base64url encoded value
    const encoded = Buffer.from(cookieValue).toString('base64url')
    await context.addCookies([{
      name: cookieName,
      value: encoded,
      domain: 'ufsl-bracket-test.vercel.app',
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
    }])
    await page.goto(`${APP_URL}/dashboard`, { waitUntil: 'networkidle' })
    console.log('After base64 attempt, landed on:', page.url())
  }

  await context.storageState({ path: AUTH_FILE })
  await browser.close()
  console.log('Auth state saved to', AUTH_FILE)
}

export default globalSetup
