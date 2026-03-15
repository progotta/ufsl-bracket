import { createClient } from '@supabase/supabase-js'
import { NotificationType, NOTIFICATION_DEFINITIONS } from './types'
import { deliverPush } from './channels/push'
import { deliverEmail } from './channels/email'
import { deliverSms } from './channels/sms'

const getServiceClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// M-6: Escape HTML to prevent injection in notification emails
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// M-6: Only allow safe UFSL-owned URLs in email links
function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && (
      u.hostname.endsWith('ufsl.net') ||
      u.hostname.endsWith('vercel.app') ||
      u.hostname === 'localhost'
    )
  } catch { return false }
}

export interface DispatchPayload {
  title: string
  body: string
  url?: string
  emailHtml?: string   // falls back to plain body if not set
  smsBody?: string     // falls back to `${title}: ${body}` if not set
}

export async function dispatch(
  userId: string,
  type: NotificationType,
  payload: DispatchPayload
) {
  const db = getServiceClient()

  // 1. Always write to in-app notifications table
  try {
    await db.from('notifications').insert({
      user_id: userId,
      type,
      title: payload.title,
      message: payload.body,
      action_url: payload.url,
    })
  } catch { /* ignore insert failures */ }

  // 2. Get notification definition defaults
  const definition = NOTIFICATION_DEFINITIONS.find(d => d.type === type)
  if (!definition) return

  // 3. Get user preferences (falls back to definition defaults if no row exists)
  const { data: pref } = await db
    .from('notification_preferences')
    .select('push_enabled, email_enabled, sms_enabled')
    .eq('user_id', userId)
    .eq('type', type)
    .single()

  const pushEnabled  = pref ? pref.push_enabled  : definition.defaultPush
  const emailEnabled = pref ? pref.email_enabled : definition.defaultEmail
  const smsEnabled   = pref ? pref.sms_enabled   : definition.defaultSms

  // 4. Get user contact info (email + phone)
  const { data: profile } = await db
    .from('profiles')
    .select('email, phone')
    .eq('id', userId)
    .single()

  // 5. Deliver to each enabled channel
  const tasks: Promise<unknown>[] = []

  if (pushEnabled) {
    tasks.push(deliverPush(userId, { title: payload.title, body: payload.body, url: payload.url, tag: type }))
  }

  if (emailEnabled && profile?.email) {
    tasks.push(deliverEmail(
      profile.email,
      payload.title,
      // M-6: Escape body to prevent HTML injection; validate URL before embedding
      payload.emailHtml || `<p>${escapeHtml(payload.body)}</p>${payload.url && isSafeUrl(payload.url) ? `<p><a href="${payload.url}">View on UFSL →</a></p>` : ''}`
    ))
  }

  if (smsEnabled && profile?.phone) {
    tasks.push(deliverSms(
      profile.phone,
      payload.smsBody || `${payload.title}: ${payload.body}`
    ))
  }

  await Promise.allSettled(tasks)
}

// Pool-wide dispatch (all members or just commissioner)
export async function dispatchToPool(
  poolId: string,
  type: NotificationType,
  payload: DispatchPayload,
  options?: { excludeUserId?: string; commissionerOnly?: boolean }
) {
  const db = getServiceClient()
  const query = db.from('pool_members').select('user_id').eq('pool_id', poolId)
  if (options?.commissionerOnly) query.eq('role', 'commissioner')
  const { data: members } = await query

  if (!members) return
  const userIds = members.map(m => m.user_id).filter((id: string) => id !== options?.excludeUserId)
  await Promise.allSettled(userIds.map((id: string) => dispatch(id, type, payload)))
}
