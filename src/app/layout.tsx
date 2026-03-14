import type { Metadata } from 'next'
import './globals.css'
import { AchievementToastProvider } from '@/components/achievements/AchievementToast'
import SimBanner from '@/components/SimBanner'
import MobileNav from '@/components/layout/MobileNav'

export const metadata: Metadata = {
  title: 'UFSL — Ultimate Fantasy Sports League',
  description: 'The last league platform you\'ll ever need. Run any pool, any sport, any league. Automatic payments, real-time updates, zero chasing. Start with March Madness.',
  openGraph: {
    title: 'UFSL — Ultimate Fantasy Sports League',
    description: 'Run any league. Any sport. Any pool. We handle the rest.',
    siteName: 'UFSL',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-brand-dark text-white">
        <SimBanner />
        <AchievementToastProvider>
          <main className="pb-16 md:pb-0">
            {children}
          </main>
        </AchievementToastProvider>
        <MobileNav />
      </body>
    </html>
  )
}
