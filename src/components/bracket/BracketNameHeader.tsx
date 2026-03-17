'use client'
import { useState } from 'react'
import { Pencil, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  bracketId: string
  initialName: string
  poolName: string
}

export default function BracketNameHeader({ bracketId, initialName, poolName }: Props) {
  const [name, setName] = useState(initialName)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const supabase = createClient()

  const save = async () => {
    const trimmed = draft.trim() || name
    setSaving(true)
    setError(false)
    const { error: dbError } = await supabase
      .from('brackets')
      .update({ bracket_name: trimmed, updated_at: new Date().toISOString() })
      .eq('id', bracketId)
    setSaving(false)
    if (dbError) {
      setError(true)
      return // stay in editing mode so user can try again
    }
    setName(trimmed)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={e => { setDraft(e.target.value); setError(false) }}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setDraft(name); setEditing(false) } }}
          maxLength={40}
          className={`flex-1 min-w-0 bg-transparent border rounded-lg px-2 py-0.5 text-lg font-black text-white focus:outline-none ${error ? 'border-red-500' : 'border-brand-orange/60'}`}
        />
        <button onClick={save} disabled={saving} className="shrink-0 text-green-400 hover:text-green-300 disabled:opacity-50">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
        </button>
        {error && <span className="text-xs text-red-400 shrink-0">Save failed</span>}
      </div>
    )
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <h1 className="text-xl font-black truncate">{name}</h1>
        <button
          onClick={() => { setDraft(name); setEditing(true) }}
          className="shrink-0 text-gray-500 hover:text-brand-orange transition-colors"
          title="Edit bracket name"
        >
          <Pencil size={14} />
        </button>
      </div>
      <p className="text-brand-muted text-xs">{poolName}</p>
    </div>
  )
}
