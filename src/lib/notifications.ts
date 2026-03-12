import webpush from 'web-push'

// Configure VAPID details once
webpush.setVapidDetails(
  'mailto:admin@ufsl.net',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export type NotificationType =
  | 'game_starting'
  | 'upset_alert'
  | 'pick_eliminated'
  | 'pool_update'
  | 'smack_mention'
  | 'bracket_reminder'

export interface NotificationPayload {
  title: string
  body: string
  url?: string
  tag?: string
  type: NotificationType
}

function buildPayload(type: NotificationType, data: Record<string, string>): NotificationPayload {
  switch (type) {
    case 'game_starting':
      return {
        type,
        title: '🏀 Game Starting Soon',
        body: data.message || `${data.team1} vs ${data.team2} tips off in 10 minutes!`,
        url: data.url || '/dashboard',
        tag: `game-${data.gameId}`,
      }
    case 'upset_alert':
      return {
        type,
        title: '🚨 UPSET ALERT',
        body: data.message || `#${data.seedLow} seed is leading #${data.seedHigh} seed!`,
        url: data.url || '/dashboard',
        tag: `upset-${data.gameId}`,
      }
    case 'pick_eliminated':
      return {
        type,
        title: '💀 Your Pick Was Eliminated',
        body: data.message || `Your champion pick ${data.team} was eliminated`,
        url: data.url || '/dashboard',
        tag: `eliminated-${data.bracketId}`,
      }
    case 'pool_update':
      return {
        type,
        title: '📊 Leaderboard Update',
        body: data.message || `You moved to #${data.rank} in ${data.poolName}!`,
        url: data.url || '/leaderboard',
        tag: `pool-${data.poolId}`,
      }
    case 'smack_mention':
      return {
        type,
        title: '💬 Someone Mentioned You',
        body: data.message || `${data.senderName} mentioned you in ${data.poolName}`,
        url: data.url || `/pools/${data.poolId}`,
        tag: `smack-${data.messageId}`,
      }
    case 'bracket_reminder':
      return {
        type,
        title: '⏰ Bracket Deadline Approaching',
        body: data.message || `Brackets lock in ${data.timeLeft || '2 hours'}!`,
        url: data.url || '/dashboard',
        tag: 'bracket-deadline',
      }
  }
}

interface PushSubscriptionRecord {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

async function sendToSubscription(
  subscription: PushSubscriptionRecord,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify(payload)
    )
    return true
  } catch (err: unknown) {
    const error = err as { statusCode?: number }
    // 410 Gone = subscription expired, should be cleaned up
    if (error?.statusCode === 410 || error?.statusCode === 404) {
      return false // Caller should delete this subscription
    }
    console.error('Push send error:', err)
    return false
  }
}

/**
 * Send a notification to a single user.
 * Requires service-role Supabase client.
 */
export async function sendNotification(
  supabase: ReturnType<typeof import('@/lib/supabase/route').createRouteClient>,
  userId: string,
  type: NotificationType,
  data: Record<string, string> = {}
): Promise<{ sent: number; failed: number }> {
  const db = supabase as ReturnType<typeof import('@/lib/supabase/route').createRouteClient> & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    from: (table: string) => any
  }

  // Check preferences
  const { data: prefs } = await db
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  // If preferences exist, check if this type is enabled
  if (prefs) {
    const prefMap: Record<NotificationType, keyof typeof prefs> = {
      game_starting: 'game_alerts',
      upset_alert: 'upset_alerts',
      pick_eliminated: 'pool_updates',
      pool_update: 'pool_updates',
      smack_mention: 'smack_mentions',
      bracket_reminder: 'game_alerts',
    }
    const prefKey = prefMap[type]
    if (prefs[prefKey] === false) return { sent: 0, failed: 0 }
  }

  // Get subscriptions
  const { data: subscriptions } = await db
    .from('push_subscriptions')
    .select('id, endpoint, keys')
    .eq('user_id', userId)

  if (!subscriptions?.length) return { sent: 0, failed: 0 }

  const payload = buildPayload(type, data)
  let sent = 0
  let failed = 0
  const expiredIds: string[] = []

  for (const sub of subscriptions) {
    const ok = await sendToSubscription(sub, payload)
    if (ok) {
      sent++
      // Update last_used
      await db
        .from('push_subscriptions')
        .update({ last_used: new Date().toISOString() })
        .eq('id', sub.id)
    } else {
      failed++
      expiredIds.push(sub.id)
    }
  }

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    await db.from('push_subscriptions').delete().in('id', expiredIds)
  }

  return { sent, failed }
}

/**
 * Send a notification to multiple users.
 * Batches to avoid rate limits.
 */
export async function sendBulkNotification(
  supabase: ReturnType<typeof import('@/lib/supabase/route').createRouteClient>,
  userIds: string[],
  type: NotificationType,
  data: Record<string, string> = {}
): Promise<{ sent: number; failed: number; skipped: number }> {
  let totalSent = 0
  let totalFailed = 0
  let totalSkipped = 0

  // Process in batches of 50
  const batchSize = 50
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize)
    const results = await Promise.allSettled(
      batch.map(uid => sendNotification(supabase, uid, type, data))
    )
    for (const result of results) {
      if (result.status === 'fulfilled') {
        totalSent += result.value.sent
        totalFailed += result.value.failed
        if (result.value.sent === 0 && result.value.failed === 0) totalSkipped++
      } else {
        totalSkipped++
      }
    }
    // Small delay between batches
    if (i + batchSize < userIds.length) {
      await new Promise(r => setTimeout(r, 100))
    }
  }

  return { sent: totalSent, failed: totalFailed, skipped: totalSkipped }
}
