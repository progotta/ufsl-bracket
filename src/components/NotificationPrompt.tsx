'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, X } from 'lucide-react'

const DISMISSED_KEY = 'ufsl_notif_dismissed'
const DISMISSED_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

interface NotificationPromptProps {
  trigger?: 'first_visit' | 'after_bracket'
  className?: string
}

export default function NotificationPrompt({ trigger = 'first_visit', className = '' }: NotificationPromptProps) {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'denied' | 'error'>('idle')

  useEffect(() => {
    // Check if push notifications are supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    // Already granted — don't prompt again
    if (Notification.permission === 'granted') return

    // Explicitly denied — respect it
    if (Notification.permission === 'denied') return

    // Check if recently dismissed
    const dismissed = localStorage.getItem(DISMISSED_KEY)
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10)
      if (Date.now() - dismissedAt < DISMISSED_TTL) return
    }

    // Show prompt
    setVisible(true)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString())
    setVisible(false)
  }

  const handleEnable = async () => {
    setLoading(true)
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Request permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        setLoading(false)
        return
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      const { endpoint, keys } = subscription.toJSON() as {
        endpoint: string
        keys: { p256dh: string; auth: string }
      }

      // Save to server
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, keys }),
      })

      if (res.ok) {
        setStatus('success')
        // Auto-hide after success
        setTimeout(() => setVisible(false), 2500)
      } else {
        setStatus('error')
      }
    } catch (err) {
      console.error('Notification subscribe error:', err)
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  if (!visible) return null

  return (
    <div className={`relative bg-brand-card border border-brand-orange/30 rounded-xl p-4 ${className}`}>
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-brand-muted hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>

      {status === 'success' ? (
        <div className="flex items-center gap-3 pr-6">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <Bell size={20} className="text-green-400" />
          </div>
          <div>
            <div className="font-semibold text-white text-sm">You&apos;re in! 🎉</div>
            <div className="text-xs text-brand-muted mt-0.5">
              We&apos;ll alert you for upsets, bracket updates, and more.
            </div>
          </div>
        </div>
      ) : status === 'denied' ? (
        <div className="flex items-center gap-3 pr-6">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <BellOff size={20} className="text-red-400" />
          </div>
          <div>
            <div className="font-semibold text-white text-sm">Notifications blocked</div>
            <div className="text-xs text-brand-muted mt-0.5">
              Enable in browser settings to get upset alerts.
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 pr-6">
          <div className="w-10 h-10 rounded-full bg-brand-orange/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bell size={20} className="text-brand-orange" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm">
              {trigger === 'after_bracket' ? 'Stay in the game!' : 'Never miss an upset!'}
            </div>
            <div className="text-xs text-brand-muted mt-0.5 mb-3">
              Get instant alerts for upsets, bracket eliminations, leaderboard moves, and smack talk.
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleEnable}
                disabled={loading}
                className="px-4 py-1.5 rounded-lg bg-brand-orange text-white text-xs font-semibold hover:bg-brand-orange/90 disabled:opacity-60 transition-all"
              >
                {loading ? 'Enabling…' : 'Enable Notifications'}
              </button>
              <button
                onClick={handleDismiss}
                className="text-xs text-brand-muted hover:text-white transition-colors px-2 py-1.5"
              >
                Not now
              </button>
            </div>
            {status === 'error' && (
              <div className="text-xs text-red-400 mt-2">
                Something went wrong. Try again later.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper: convert VAPID public key from base64url to Uint8Array
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer
}
