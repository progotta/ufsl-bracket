'use client'
import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { FEATURES } from '@/lib/features'

export default function PushPrompt() {
  const [state, setState] = useState<'idle' | 'prompt' | 'subscribed' | 'denied' | 'unsupported'>('idle')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    const perm = Notification.permission
    if (perm === 'granted') setState('subscribed')
    else if (perm === 'denied') setState('denied')
    else setState('prompt')

    const wasDismissed = localStorage.getItem('push-prompt-dismissed')
    if (wasDismissed) setDismissed(true)
  }, [])

  const subscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })

      const json = sub.toJSON()
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      })

      setState('subscribed')
    } catch (err) {
      console.error('Push subscribe failed:', err)
      setState('denied')
    }
  }

  const dismiss = () => {
    localStorage.setItem('push-prompt-dismissed', '1')
    setDismissed(true)
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const output = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
    return output
  }

  if (!FEATURES.pushNotifications || state !== 'prompt' || dismissed) return null

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-40 bg-brand-surface border border-brand-orange/30 rounded-2xl p-4 shadow-2xl animate-fade-in">
      <button onClick={dismiss} className="absolute top-3 right-3 text-brand-muted hover:text-white">
        <X size={16} />
      </button>
      <div className="flex items-start gap-3">
        <div className="bg-brand-orange/10 rounded-xl p-2 mt-0.5">
          <Bell size={20} className="text-brand-orange" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">Stay in the game</p>
          <p className="text-xs text-brand-muted mt-0.5">Get notified when rounds complete, picks lock, and your bracket is still alive.</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={subscribe}
              className="flex-1 bg-brand-orange text-white text-xs font-bold py-2 rounded-xl hover:bg-brand-orange/90 transition-colors"
            >
              Turn on notifications
            </button>
            <button
              onClick={dismiss}
              className="text-xs text-brand-muted hover:text-white px-3"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
