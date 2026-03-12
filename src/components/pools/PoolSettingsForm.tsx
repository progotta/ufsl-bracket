'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, Trash2, RefreshCw, Link as LinkIcon } from 'lucide-react'
import type { Pool } from '@/types/database'

interface PoolSettingsFormProps {
  pool: Pool & { max_members?: number | null; join_requires_approval?: boolean }
}

export default function PoolSettingsForm({ pool }: PoolSettingsFormProps) {
  const [name, setName] = useState(pool.name)
  const [description, setDescription] = useState(pool.description || '')
  const [isPublic, setIsPublic] = useState(pool.is_public)
  const [status, setStatus] = useState(pool.status)
  const [maxMembers, setMaxMembers] = useState<string>(pool.max_members ? String(pool.max_members) : '')
  const [joinRequiresApproval, setJoinRequiresApproval] = useState(pool.join_requires_approval || false)
  const [inviteCode, setInviteCode] = useState(pool.invite_code)
  const [regenerating, setRegenerating] = useState(false)
  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${inviteCode}`
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('pools')
      .update({
        name,
        description: description || null,
        is_public: isPublic,
        status,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        max_members: maxMembers ? parseInt(maxMembers) : null as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        join_requires_approval: joinRequiresApproval as any,
      })
      .eq('id', pool.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${pool.name}"? This cannot be undone. All brackets and picks will be lost.`)) return
    setDeleting(true)
    await supabase.from('pools').delete().eq('id', pool.id)
    router.push('/dashboard')
  }

  const handleLock = async () => {
    if (!confirm('Lock this pool? Players will no longer be able to change their picks.')) return
    await supabase.from('pools').update({ status: 'locked', locked_at: new Date().toISOString() }).eq('id', pool.id)
    router.refresh()
  }

  const handleRegenerateCode = async () => {
    if (!confirm('Generate a new invite code? The old link will stop working.')) return
    setRegenerating(true)
    const { data } = await supabase.rpc('generate_invite_code')
    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('pools').update({ invite_code: data }).eq('id', pool.id)
      setInviteCode(data)
      router.refresh()
    }
    setRegenerating(false)
  }

  return (
    <div className="space-y-6">
      {/* Basic settings */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-5">Pool Details</h2>
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              maxLength={60}
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
              className="input-base resize-none"
            />
          </div>
          <div className="flex items-center justify-between bg-brand-card rounded-xl p-4 border border-brand-border">
            <div>
              <div className="font-semibold text-sm">Public Pool</div>
              <div className="text-xs text-brand-muted mt-0.5">Anyone can find and join</div>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublic ? 'bg-brand-orange' : 'bg-brand-border'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>
          )}

          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle size={16} className="text-green-400" /> : null}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Status management */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-2">Pool Status</h2>
        <p className="text-brand-muted text-sm mb-4">Current status: <strong className="text-white">{pool.status}</strong></p>
        <div className="flex flex-wrap gap-3">
          {pool.status === 'open' && (
            <button onClick={handleLock} className="btn-secondary text-sm flex items-center gap-2">
              🔒 Lock Picks
            </button>
          )}
          <button
            onClick={handleRegenerateCode}
            className="btn-secondary text-sm"
          >
            🔄 New Invite Code
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
        <h2 className="font-bold text-lg text-red-400 mb-2">Danger Zone</h2>
        <p className="text-brand-muted text-sm mb-4">Delete this pool and all associated brackets. This cannot be undone.</p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          Delete Pool
        </button>
      </div>
    </div>
  )
}
