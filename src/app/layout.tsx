import type { Metadata } from 'next'
import './globals.css'
import { AchievementToastProvider } from '@/components/achievements/AchievementToast'
import SimBanner from '@/components/SimBanner'
import MobileNav from '@/components/layout/MobileNav'
import PushPrompt from '@/components/layout/PushPrompt'
import { createServerClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'UFSL — Ultimate Fantasy Sports League',
  description: 'The last league platform you\'ll ever need. Run any pool, any sport, any league. Automatic payments, real-time updates, zero chasing. Start with March Madness.',
  openGraph: {
    title: 'UFSL — Ultimate Fantasy Sports League',
    description: 'Run any league. Any sport. Any pool. We handle the rest.',
    siteName: 'UFSL',
  },
}

// M-2: Check admin status server-side so ADMIN_USER_IDS never leaks into the JS bundle
async function getIsAdmin(): Promise<boolean> {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return false
    const adminIds = (process.env.ADMIN_USER_IDS || '')
      .split(',')
      .map(id => id.trim())
      .filter(Boolean)
    return adminIds.includes(session.user.id)
  } catch {
    return false
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAdmin = await getIsAdmin()

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-brand-dark text-white">
        <SimBanner isAdmin={isAdmin} />
        <AchievementToastProvider>
          <main className="pb-16 md:pb-0">
            {children}
          </main>
        </AchievementToastProvider>
        <MobileNav />
        <PushPrompt />
      </body>
    </html>
  )
}
