'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, BellOff, CheckCircle, Send, AlertCircle, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface Preferences {
  game_alerts: boolean
  upset_alerts: boolean
  pool_updates: boolean
  smack_mentions: boolean
  marketing: boolean
}

const defaultPrefs: Preferences = {
  game_alerts: true,
  upset_alerts: true,
  pool_updates: true,
  smack_mentions: true,
  marketing: false,
}

const PREF_LABELS: { key: keyof Preferences; label: string; description: string; emoji: string }[] = [
  {
    key: 'game_alerts',
    label: 'Game Alerts',
    description: 'Get notified when games are starting soon',
    emoji: '🏀',
  },
  {
    key: 'upset_alerts',
    label: 'Upset Alerts',
    description: 'Be alerted when a lower seed is threatening an upset',
    emoji: '🚨',
  },
  {
    key: 'pool_updates',
    label: 'Pool & Bracket Updates',
    description: 'Leaderboard changes and elimination alerts',
    emoji: '📊',
  },
  {
    key: 'smack_mentions',
    label: 'Smack Talk Mentions',
    description: 'When someone mentions you in a pool chat',
    emoji: '💬',
  },
  {
    key: 'marketing',
    label: 'UFSL Updates',
    description: 'News, features, and seasonal announcements',
    emoji: '📣',
  },
]

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        enabled ? 'bg-brand-orange' : 'bg-brand-border'
      }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

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

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<Preferences>(defaultPrefs)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'sent' | 'error'>('idle')

  useEffect(() => {
    // Check notification support and permission
    if (!('Notification' in window)) {
      setPermissionStatus('unsupported')
    } else {
      setPermissionStatus(Notification.permission)
    }

    // Check if already subscribed
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription()
        setSubscribed(!!sub)
      }).catch(() => {})
    }

    // Load preferences
    fetch('/api/notifications/preferences')
      .then(r => r.json())
      .then(d => {
        if (d.preferences) setPrefs(d.preferences)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const savePrefs = useCallback(async (newPrefs: Preferences) => {
    setSaving(true)
    setSaveStatus('idle')
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs),
      })
      setSaveStatus(res.ok ? 'saved' : 'error')
    } catch {
      setSaveStatus('error')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [])

  const handleToggle = (key: keyof Preferences, value: boolean) => {
    const newPrefs = { ...prefs, [key]: value }
    setPrefs(newPrefs)
    savePrefs(newPrefs)
  }

  const handleSubscribe = async () => {
    setSubscribing(true)
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const permission = await Notification.requestPermission()
      setPermissionStatus(permission)
      if (permission !== 'granted') return

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })

      const { endpoint, keys } = subscription.toJSON() as {
        endpoint: string
        keys: { p256dh: string; auth: string }
      }

      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, keys }),
      })

      setSubscribed(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSubscribing(false)
    }
  }

  const handleUnsubscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
      }
      setSubscribed(false)
    } catch (err) {
      console.error(err)
    }
  }

  const handleTestNotification = async () => {
    setTestStatus('idle')
    try {
      // Show a local notification directly (no server needed for test)
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification('🏀 UFSL Test Notification', {
        body: 'Push notifications are working! You\'ll get upset alerts and game updates.',
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        tag: 'test-notification',
      })
      setTestStatus('sent')
      setTimeout(() => setTestStatus('idle'), 3000)
    } catch (err) {
      console.error(err)
      setTestStatus('error')
      setTimeout(() => setTestStatus('idle'), 3000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
      </div>
    )
  }

  const isSupported = permissionStatus !== 'unsupported'

  return (
    <div className="min-h-screen bg-brand-dark py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1 text-brand-muted hover:text-white text-sm mb-4 transition-colors"
          >
            <ChevronLeft size={16} />
            Back to Profile
          </Link>
          <h1 className="text-2xl font-bold text-white">Notification Settings</h1>
          <p className="text-brand-muted text-sm mt-1">
            Control what alerts you receive from UFSL
          </p>
        </div>

        {/* Subscription Status Card */}
        <div className="bg-brand-card border border-brand-border rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-4">
            Push Notifications
          </h2>

          {!isSupported ? (
            <div className="flex items-center gap-3 text-yellow-400">
              <AlertCircle size={20} />
              <span className="text-sm">Your browser doesn&apos;t support push notifications.</span>
            </div>
          ) : permissionStatus === 'denied' ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <BellOff size={20} className="text-red-400" />
              </div>
              <div>
                <div className="font-semibold text-white text-sm">Blocked by browser</div>
                <div className="text-xs text-brand-muted mt-0.5">
                  Allow notifications in your browser settings to re-enable.
                </div>
              </div>
            </div>
          ) : subscribed ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Bell size={20} className="text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">Notifications enabled ✓</div>
                  <div className="text-xs text-brand-muted mt-0.5">
                    You&apos;ll receive alerts based on your preferences below.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTestNotification}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border text-sm text-brand-muted hover:text-white hover:border-brand-orange/50 transition-all"
                >
                  <Send size={14} />
                  {testStatus === 'sent' ? 'Sent!' : testStatus === 'error' ? 'Failed' : 'Test Notification'}
                </button>
                <button
                  onClick={handleUnsubscribe}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-sm text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <BellOff size={14} />
                  Unsubscribe
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-orange/20 flex items-center justify-center flex-shrink-0">
                <Bell size={20} className="text-brand-orange" />
              </div>
              <div>
                <div className="font-semibold text-white text-sm">Push notifications not enabled</div>
                <div className="text-xs text-brand-muted mt-0.5 mb-3">
                  Enable to get instant upset alerts, game updates, and pool notifications.
                </div>
                <button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className="px-4 py-2 rounded-lg bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange/90 disabled:opacity-60 transition-all"
                >
                  {subscribing ? 'Enabling…' : 'Enable Notifications'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preference Toggles */}
        <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-wider">
              Alert Types
            </h2>
            {saving && (
              <span className="text-xs text-brand-muted animate-pulse">Saving…</span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <CheckCircle size={12} />
                Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-xs text-red-400">Save failed</span>
            )}
          </div>

          <div className="divide-y divide-brand-border">
            {PREF_LABELS.map(({ key, label, description, emoji }) => (
              <div key={key} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl leading-none mt-0.5">{emoji}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{label}</div>
                    <div className="text-xs text-brand-muted mt-0.5">{description}</div>
                  </div>
                </div>
                <Toggle enabled={prefs[key]} onChange={v => handleToggle(key, v)} />
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-brand-muted text-center">
          Notification preferences are saved automatically. You can unsubscribe anytime.
        </p>
      </div>
    </div>
  )
}
