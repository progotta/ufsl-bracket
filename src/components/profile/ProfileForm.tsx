'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, LogOut, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types/database'
import PlayerAvatar from '@/components/ui/PlayerAvatar'
import AvatarIcon from '@/components/ui/AvatarIcon'
import { AVATAR_ICONS, type AvatarIconKey } from '@/lib/avatars'

interface ProfileFormProps {
  profile: Profile | null
  userId: string
}

const TIMEZONES = [
  { value: "America/New_York",    label: "Eastern Time (ET)" },
  { value: "America/Chicago",     label: "Central Time (CT)" },
  { value: "America/Denver",      label: "Mountain Time (MT)" },
  { value: "America/Phoenix",     label: "Arizona (no DST)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage",   label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu",    label: "Hawaii Time (HT)" },
  { value: "Europe/London",       label: "London (GMT/BST)" },
  { value: "Europe/Paris",        label: "Central European (CET)" },
  { value: "Asia/Tokyo",          label: "Japan (JST)" },
  { value: "Australia/Sydney",    label: "Sydney (AEST)" },
]

export default function ProfileForm({ profile, userId }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [timezone, setTimezone] = useState(profile?.timezone || 'America/Denver')
  const [avatarIcon, setAvatarIcon] = useState<string | null>(profile?.avatar_icon || null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingIcon, setSavingIcon] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        timezone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    }
    setLoading(false)
  }

  const handleSelectIcon = async (key: AvatarIconKey) => {
    setAvatarIcon(key)
    setPickerOpen(false)
    setSavingIcon(true)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_icon: key,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      setError(updateError.message)
      setAvatarIcon(profile?.avatar_icon || null)
    } else {
      router.refresh()
    }
    setSavingIcon(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const selectedIcon = AVATAR_ICONS.find(a => a.key === avatarIcon)

  return (
    <div className="space-y-6">
      {/* Mascot Picker */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-4">Choose Your Mascot</h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            <PlayerAvatar
              userId={userId}
              displayName={profile?.display_name}
              avatarUrl={profile?.avatar_url}
              avatarIcon={avatarIcon}
              size="w-16 h-16"
              rounded="2xl"
              borderClass="border-brand-orange/50"
            />
            {savingIcon && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
                <Loader2 size={20} className="animate-spin text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="font-semibold">
              {selectedIcon ? selectedIcon.label : 'No mascot selected'}
            </div>
            <div className="text-xs text-brand-muted mt-0.5">
              {selectedIcon ? 'Your mascot shows next to your name everywhere' : 'Pick a mascot to represent you on leaderboards'}
            </div>
            <button
              type="button"
              onClick={() => setPickerOpen(!pickerOpen)}
              className="mt-2 text-sm font-semibold text-brand-orange hover:underline"
            >
              {selectedIcon ? 'Change Mascot' : 'Pick a Mascot'}
            </button>
          </div>
        </div>

        {/* Picker Grid */}
        {pickerOpen && (
          <div className="mt-4 border-t border-brand-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-brand-muted">Tap to select</span>
              <button onClick={() => setPickerOpen(false)} className="text-brand-muted hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {AVATAR_ICONS.map((icon) => (
                <button
                  key={icon.key}
                  onClick={() => handleSelectIcon(icon.key)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all hover:bg-brand-card ${
                    avatarIcon === icon.key
                      ? 'bg-brand-orange/10 ring-2 ring-brand-orange'
                      : 'bg-brand-surface'
                  }`}
                >
                  <AvatarIcon avatarKey={icon.key} size={40} />
                  <span className="text-[10px] text-brand-muted font-medium leading-tight text-center">
                    {icon.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Avatar section */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 flex items-center gap-6">
        <div className="relative">
          <PlayerAvatar
            userId={userId}
            displayName={profile?.display_name}
            avatarUrl={profile?.avatar_url}
            avatarIcon={avatarIcon}
            size="w-20 h-20"
            rounded="2xl"
            borderClass="border-brand-border"
          />
        </div>
        <div>
          <div className="font-bold text-lg">{profile?.display_name || 'No name set'}</div>
          <div className="text-brand-muted text-sm">{profile?.email || 'No email'}</div>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-5">Edit Profile</h2>
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name or nickname"
              maxLength={30}
              className="input-base"
            />
            <p className="text-xs text-brand-muted mt-1">{displayName.length}/30 — shown on leaderboards</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Time Zone</label>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-orange/50"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          {profile?.email && (
            <div>
              <label className="block text-sm font-semibold mb-2">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="input-base opacity-50 cursor-not-allowed"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : saved ? (
              <CheckCircle size={16} className="text-green-400" />
            ) : null}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Sign out */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-2">Account</h2>
        <p className="text-brand-muted text-sm mb-4">Sign out of your UFSL Bracket account.</p>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )
}
