'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import {
  PLAYER_NOTIFICATIONS,
  COMMISSIONER_NOTIFICATIONS,
  type NotificationDefinition,
  type NotificationType,
} from '@/lib/notifications/types'

interface PrefRecord {
  type: NotificationType
  push_enabled: boolean
  email_enabled: boolean
  sms_enabled: boolean
}

interface Props {
  emailConfigured: boolean
  smsConfigured: boolean
}

function ChannelPill({
  label,
  enabled,
  configured,
  onChange,
}: {
  label: string
  enabled: boolean
  configured: boolean
  onChange: (v: boolean) => void
}) {
  if (!configured) {
    return (
      <span
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-border/50 text-brand-muted cursor-not-allowed"
        title="Coming soon"
      >
        {label}
      </span>
    )
  }
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        enabled
          ? 'bg-brand-orange text-white'
          : 'bg-brand-border text-brand-muted hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}

function NotifPrefRow({
  definition,
  pref,
  emailConfigured,
  smsConfigured,
  onChange,
}: {
  definition: NotificationDefinition
  pref?: PrefRecord
  emailConfigured: boolean
  smsConfigured: boolean
  onChange: (type: NotificationType, channel: 'push_enabled' | 'email_enabled' | 'sms_enabled', value: boolean) => void
}) {
  const pushEnabled = pref ? pref.push_enabled : definition.defaultPush
  const emailEnabled = pref ? pref.email_enabled : definition.defaultEmail
  const smsEnabled = pref ? pref.sms_enabled : definition.defaultSms

  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex-1 min-w-0 mr-4">
        <div className="text-sm font-medium text-white">{definition.label}</div>
        <div className="text-xs text-brand-muted mt-0.5">{definition.description}</div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <ChannelPill
          label="Push"
          enabled={pushEnabled}
          configured={true}
          onChange={(v) => onChange(definition.type, 'push_enabled', v)}
        />
        <ChannelPill
          label="Email"
          enabled={emailEnabled}
          configured={emailConfigured}
          onChange={(v) => onChange(definition.type, 'email_enabled', v)}
        />
        <ChannelPill
          label="SMS"
          enabled={smsEnabled}
          configured={smsConfigured}
          onChange={(v) => onChange(definition.type, 'sms_enabled', v)}
        />
      </div>
    </div>
  )
}

export default function NotificationSettingsClient({ emailConfigured, smsConfigured }: Props) {
  const [prefs, setPrefs] = useState<Record<string, PrefRecord>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/notifications/preferences')
      .then(r => r.json())
      .then(d => {
        const map: Record<string, PrefRecord> = {}
        for (const p of d.preferences || []) {
          map[p.type] = p
        }
        setPrefs(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const savePref = useCallback(async (
    type: NotificationType,
    channel: 'push_enabled' | 'email_enabled' | 'sms_enabled',
    value: boolean
  ) => {
    // Find matching definition for defaults
    const allDefs = [...PLAYER_NOTIFICATIONS, ...COMMISSIONER_NOTIFICATIONS]
    const def = allDefs.find(d => d.type === type)
    if (!def) return

    const existing = prefs[type]
    const updated: PrefRecord = {
      type,
      push_enabled: existing ? existing.push_enabled : def.defaultPush,
      email_enabled: existing ? existing.email_enabled : def.defaultEmail,
      sms_enabled: existing ? existing.sms_enabled : def.defaultSms,
      [channel]: value,
    }

    setPrefs(prev => ({ ...prev, [type]: updated }))
    setSaving(true)

    try {
      await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
    } catch { /* silently fail */ }
    finally { setSaving(false) }
  }, [prefs])

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
      </div>
    )
  }

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Notification Settings</h1>
              <p className="text-brand-muted text-sm mt-1">
                Control how you receive alerts from UFSL
              </p>
            </div>
            {saving && (
              <span className="text-xs text-brand-muted animate-pulse">Saving...</span>
            )}
          </div>
        </div>

        {/* Player Notifications */}
        <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-brand-border">
            <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-wider">
              Player Notifications
            </h2>
          </div>
          <div className="divide-y divide-brand-border">
            {PLAYER_NOTIFICATIONS.map(def => (
              <NotifPrefRow
                key={def.type}
                definition={def}
                pref={prefs[def.type]}
                emailConfigured={emailConfigured}
                smsConfigured={smsConfigured}
                onChange={savePref}
              />
            ))}
          </div>
        </div>

        {/* Commissioner Notifications */}
        <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-brand-border">
            <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-wider">
              Commissioner Notifications
            </h2>
          </div>
          <div className="divide-y divide-brand-border">
            {COMMISSIONER_NOTIFICATIONS.map(def => (
              <NotifPrefRow
                key={def.type}
                definition={def}
                pref={prefs[def.type]}
                emailConfigured={emailConfigured}
                smsConfigured={smsConfigured}
                onChange={savePref}
              />
            ))}
          </div>
        </div>

        {!emailConfigured && !smsConfigured && (
          <p className="text-xs text-brand-muted text-center mb-4">
            Email and SMS channels are coming soon. Push notifications are available now.
          </p>
        )}

        <p className="text-xs text-brand-muted text-center">
          Preferences are saved automatically.
        </p>
      </div>
    </div>
  )
}
