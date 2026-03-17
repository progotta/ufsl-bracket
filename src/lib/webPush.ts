import webPush from 'web-push'
import { createServiceClient } from '@/lib/supabase/server'

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
  const db = createServiceClient()
  const { data: subs } = await db
    .from('push_subscriptions')
    .select('endpoint, keys')
    .eq('user_id', userId)

  if (!subs?.length) return

  const results = await Promise.allSettled(
    subs.map(sub =>
      webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: (sub.keys as any).p256dh, auth: (sub.keys as any).auth } },
        JSON.stringify(payload)
      )
    )
  )
  return results
}

export async function sendPushToPool(poolId: string, payload: PushPayload, excludeUserId?: string) {
  const db = createServiceClient()
  const { data: members } = await db
    .from('pool_members')
    .select('user_id')
    .eq('pool_id', poolId)

  if (!members) return
  const userIds = members.map(m => m.user_id).filter(id => id !== excludeUserId)
  if (userIds.length === 0) return

  // Batch subscription lookup — single query for all users instead of N per-user queries
  const { data: allSubs } = await db
    .from('push_subscriptions')
    .select('user_id, endpoint, keys')
    .in('user_id', userIds)

  if (!allSubs?.length) return

  // Dispatch to all subscriptions in parallel
  const tasks: Promise<unknown>[] = allSubs.map(sub =>
    webPush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: (sub.keys as any).p256dh, auth: (sub.keys as any).auth } },
      JSON.stringify(payload)
    ).catch(() => {})
  )
  await Promise.allSettled(tasks)
}
