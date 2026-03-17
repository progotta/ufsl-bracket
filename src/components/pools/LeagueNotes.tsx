'use client'
import { useState } from 'react'
import { Edit2, Check, X, Megaphone } from 'lucide-react'

interface Props {
  poolId: string
  initialNotes: string | null
  isCommissioner: boolean
  notesUpdatedAt: string | null
}

export default function LeagueNotes({ poolId, initialNotes, isCommissioner, notesUpdatedAt }: Props) {
  const [notes, setNotes] = useState(initialNotes || '')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(notes)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await fetch(`/api/pools/${poolId}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: draft }),
    })
    setNotes(draft)
    setSaving(false)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(notes)
    setEditing(false)
  }

  // Don't render if no notes and not commissioner
  if (!notes && !isCommissioner) return null

  return (
    <div className="bg-brand-surface rounded-2xl p-4 border border-brand-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Megaphone size={16} className="text-brand-orange" />
          <span className="font-bold text-sm">League Notes</span>
        </div>
        {isCommissioner && !editing && (
          <button
            onClick={() => { setDraft(notes); setEditing(true) }}
            className="text-brand-muted hover:text-white transition-colors"
          >
            <Edit2 size={14} />
          </button>
        )}
        {editing && (
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="text-green-400 hover:text-green-300">
              <Check size={16} />
            </button>
            <button onClick={cancel} className="text-brand-muted hover:text-white">
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Add league rules, announcements, payout details\u2026"
          rows={4}
          className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-brand-orange"
        />
      ) : notes ? (
        <p className="text-sm text-brand-muted whitespace-pre-wrap">{notes}</p>
      ) : (
        <p className="text-xs text-brand-muted italic">
          Add league rules, payout details, or announcements for your members.
        </p>
      )}

      {notesUpdatedAt && !editing && (
        <p className="text-xs text-brand-muted mt-2 opacity-50">
          Updated {new Date(notesUpdatedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
