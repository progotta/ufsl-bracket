'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirects to the new unified notification settings page
export default function LegacyNotificationSettingsPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/profile/notifications')
  }, [router])

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
    </div>
  )
}
