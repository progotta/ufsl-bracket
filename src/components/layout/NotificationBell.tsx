'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Check, X } from 'lucide-react'
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

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const unreadCount = notifications.filter(n => !n.read).length

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setNotifications(data as Notification[])
  }, [userId, supabase])

  useEffect(() => {
    fetchNotifications()

    // Realtime subscription for new notifications
    const channel = supabase
      .channel('notifications-bell')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 20))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length === 0) return
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleClick = (n: Notification) => {
    if (!n.read) {
      supabase.from('notifications').update({ read: true }).eq('id', n.id).then()
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
    }
    if (n.action_url) {
      window.location.href = n.action_url
    }
    setOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative text-brand-muted hover:text-brand-orange transition-colors p-1"
        title="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-4 right-4 sm:absolute sm:left-auto sm:right-0 sm:w-80 top-auto sm:top-full mt-2 max-h-96 overflow-y-auto bg-brand-surface border border-brand-border rounded-xl shadow-xl z-[200]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
            <Link href="/notifications" onClick={() => setOpen(false)} className="font-bold text-sm hover:text-brand-orange transition-colors">
              Notifications
            </Link>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-brand-orange hover:underline flex items-center gap-1"
              >
                <Check size={12} />
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-brand-muted text-sm">
              No notifications yet
            </div>
          ) : (
            <div>
              {notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={clsx(
                    'w-full text-left px-4 py-3 border-b border-brand-border/50 hover:bg-brand-card transition-colors',
                    !n.read && 'bg-brand-orange/5'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{n.title}</span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-brand-orange flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-brand-muted mt-0.5 line-clamp-2">{n.message}</p>
                      <span className="text-[10px] text-brand-muted mt-1 block">{timeAgo(n.created_at)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
