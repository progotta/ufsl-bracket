import { createClient } from '@supabase/supabase-js'
import { sendPushToUser } from './webPush'

const getServiceClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

export async function notify(userId: string, notification: {
  pool_id?: string
  type: string
  title: string
  message: string
  action_url?: string
}) {
  const supabase = getServiceClient()
  await supabase.from('notifications').insert({ user_id: userId, ...notification })

  await sendPushToUser(userId, {
    title: notification.title,
    body: notification.message,
    url: notification.action_url || '/',
    tag: notification.type,
  }).catch(() => {})
}

export async function notifyCommissioner(poolId: string, notification: {
  type: string
  title: string
  message: string
  action_url?: string
}) {
  const supabase = getServiceClient()
  const { data: pool } = await supabase
    .from('pools')
    .select('commissioner_id')
    .eq('id', poolId)
    .single()

  if (pool) {
    await notify(pool.commissioner_id, { pool_id: poolId, ...notification })
  }
}

export async function notifyPoolMembers(poolId: string, notification: {
  type: string
  title: string
  message: string
  action_url?: string
}) {
  const supabase = getServiceClient()
  const { data: members } = await supabase
    .from('pool_members')
    .select('user_id')
    .eq('pool_id', poolId)

  if (members) {
    const rows = members.map(m => ({
      user_id: m.user_id,
      pool_id: poolId,
      ...notification,
    }))
    await supabase.from('notifications').insert(rows)
  }
}
