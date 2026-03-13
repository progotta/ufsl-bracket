import type { Metadata } from 'next'
import './globals.css'
import { AchievementToastProvider } from '@/components/achievements/AchievementToast'
import SimBanner from '@/components/SimBanner'

export const metadata: Metadata = {
  title: 'UFSL Bracket Challenge',
  description: 'March Madness bracket pool for UFSL.net — pick your bracket, beat your friends.',
  openGraph: {
    title: 'UFSL Bracket Challenge',
    description: 'March Madness bracket pool for UFSL.net',
    siteName: 'UFSL Bracket Challenge',
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
          {children}
        </AchievementToastProvider>
      </body>
    </html>
  )
}
