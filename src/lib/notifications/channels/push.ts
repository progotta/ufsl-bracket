import { sendPushToUser } from '@/lib/webPush'

export async function deliverPush(userId: string, payload: { title: string; body: string; url?: string; tag?: string }) {
  await sendPushToUser(userId, payload).catch(() => {})
}
