'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, Settings, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import clsx from 'clsx'

interface Notification {
  id: string
  created_at: string
  type: string
  title: string
  message: string
  read: boolean
  action_url: string | null
  pool_id: string | null
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const TYPE_ICONS: Record<string, string> = {
  payment_received: '💰',
  bracket_submitted: '🎯',
  pool_almost_full: '🔥',
  pick_reminder: '⏰',
  payment_reminder: '💸',
  round_complete: '🏀',
  pool_locked: '🔒',
}

interface Props {
  userId: string
  initialNotifications: Notification[]
}

export default function NotificationsClient({ userId, initialNotifications }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const router = useRouter()
  const supabase = createClient()

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length === 0) return
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [notifications, supabase])

  const handleClick = useCallback(async (n: Notification) => {
    if (!n.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', n.id)
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
    }
    if (n.action_url) {
      router.push(n.action_url)
    }
  }, [supabase, router])

  return (
    <div className="min-h-screen bg-brand-dark text-brand-text">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-brand-muted hover:text-brand-orange transition-colors"
            >
              <ChevronLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <Bell size={20} className="text-brand-orange" />
              <h1 className="text-xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <span className="min-w-[22px] h-5 flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full px-1.5">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-brand-orange hover:underline flex items-center gap-1"
              >
                <Check size={12} />
                Mark all read
              </button>
            )}
            <Link
              href="/profile/notifications"
              className="text-brand-muted hover:text-brand-orange transition-colors"
              title="Notification settings"
            >
              <Settings size={16} />
            </Link>
          </div>
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-brand-muted">
            <Bell size={40} className="mb-4 opacity-30" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-border rounded-xl border border-brand-border overflow-hidden">
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={clsx(
                  'w-full text-left px-4 py-4 hover:bg-brand-card transition-colors flex items-start gap-4',
                  !n.read ? 'bg-brand-orange/5' : 'bg-brand-surface'
                )}
              >
                <span className="text-2xl mt-0.5 flex-shrink-0">
                  {TYPE_ICONS[n.type] || '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm">{n.title}</span>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-brand-orange flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-brand-muted">{n.message}</p>
                  <span className="text-xs text-brand-muted/60 mt-1 block">
                    {timeAgo(n.created_at)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
