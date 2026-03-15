// src/lib/notify.ts — legacy shim, use dispatch() directly for new code
import { dispatch, dispatchToPool } from './notifications/dispatch'
import { NotificationType } from './notifications/types'

export { dispatch as dispatchNotification } from './notifications/dispatch'
export { dispatchToPool } from './notifications/dispatch'

// Backward-compat: existing callers pass { pool_id, type, title, message, action_url }
export async function notify(userId: string, notification: {
  pool_id?: string
  type: string
  title: string
  message: string
  action_url?: string
}) {
  await dispatch(userId, notification.type as NotificationType, {
    title: notification.title,
    body: notification.message,
    url: notification.action_url,
  })
}

export async function notifyCommissioner(poolId: string, notification: {
  type: string
  title: string
  message: string
  action_url?: string
}) {
  await dispatchToPool(poolId, notification.type as NotificationType, {
    title: notification.title,
    body: notification.message,
    url: notification.action_url,
  }, { commissionerOnly: true })
}

export async function notifyPoolMembers(poolId: string, notification: {
  type: string
  title: string
  message: string
  action_url?: string
}) {
  await dispatchToPool(poolId, notification.type as NotificationType, {
    title: notification.title,
    body: notification.message,
    url: notification.action_url,
  })
}
