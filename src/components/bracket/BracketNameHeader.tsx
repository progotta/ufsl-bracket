'use client'
import { useState } from 'react'
import { Pencil, Check } from 'lucide-react'
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
  const supabase = createClient()

  const save = async () => {
    const trimmed = draft.trim() || initialName
    setName(trimmed)
    setEditing(false)
    await supabase.from('brackets').update({ bracket_name: trimmed, updated_at: new Date().toISOString() }).eq('id', bracketId)
  }

  if (editing) {
    return (
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setDraft(name); setEditing(false) } }}
          maxLength={40}
          className="flex-1 min-w-0 bg-transparent border border-brand-orange/60 rounded-lg px-2 py-0.5 text-lg font-black text-white focus:outline-none"
        />
        <button onClick={save} className="shrink-0 text-green-400 hover:text-green-300">
          <Check size={18} />
        </button>
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
