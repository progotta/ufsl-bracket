import webPush from 'web-push'
import { createReadClient } from '@/lib/supabase/server'

let vapidConfigured = false
function ensureVapid() {
  if (vapidConfigured) return
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return
  webPush.setVapidDetails('mailto:hello@ufsl.net', publicKey, privateKey)
  vapidConfigured = true
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
  tag?: string
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  ensureVapid()
  const db = createReadClient()
  const { data: subs } = await db
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subs?.length) return

  const results = await Promise.allSettled(
    subs.map(sub =>
      webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  )
  return results
}

export async function sendPushToPool(poolId: string, payload: PushPayload, excludeUserId?: string) {
  const db = createReadClient()
  const { data: members } = await db
    .from('pool_members')
    .select('user_id')
    .eq('pool_id', poolId)

  if (!members) return
  const userIds = members.map(m => m.user_id).filter(id => id !== excludeUserId)
  await Promise.allSettled(userIds.map(id => sendPushToUser(id, payload)))
}
