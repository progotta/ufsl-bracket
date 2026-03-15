import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotificationSettingsClient from './NotificationSettingsClient'

export default async function NotificationSettingsPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth')

  const emailConfigured = !!process.env.RESEND_API_KEY
  const smsConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_PHONE_NUMBER)

  return (
    <NotificationSettingsClient
      emailConfigured={emailConfigured}
      smsConfigured={smsConfigured}
    />
  )
}
