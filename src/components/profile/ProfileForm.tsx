'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types/database'
import PlayerAvatar from '@/components/ui/PlayerAvatar'

interface ProfileFormProps {
  profile: Profile | null
  userId: string
}

export default function ProfileForm({ profile, userId }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        display_name: displayName.trim(),
        updated_at: new Date().toISOString(),
      })

    if (updateError) {
      setError(updateError.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const initials = (displayName || profile?.email || 'U')[0].toUpperCase()

  return (
    <div className="space-y-6">
      {/* Avatar section */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 flex items-center gap-6">
        <div className="relative">
          <PlayerAvatar
            userId={userId}
            displayName={profile?.display_name}
            avatarUrl={profile?.avatar_url}
            size="w-20 h-20"
            rounded="2xl"
            borderClass="border-brand-border"
          />
        </div>
        <div>
          <div className="font-bold text-lg">{profile?.display_name || 'No name set'}</div>
          <div className="text-brand-muted text-sm">{profile?.email || 'No email'}</div>
          <div className="text-xs text-brand-muted mt-1">
            Avatar synced from your OAuth provider
          </div>
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
