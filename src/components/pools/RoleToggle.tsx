'use client'
import { useState } from 'react'
import { Shield, ShieldOff, Loader2 } from 'lucide-react'

interface Props {
  memberId: string
  poolId: string
  currentRole: 'commissioner' | 'member'
  memberName: string
}

export default function RoleToggle({ memberId, poolId, currentRole, memberName }: Props) {
  const [role, setRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    const newRole = role === 'commissioner' ? 'member' : 'commissioner'
    if (!confirm(
      newRole === 'commissioner'
        ? `Make ${memberName} a co-commissioner? They'll have full admin access to this pool.`
        : `Remove ${memberName}'s co-commissioner access?`
    )) return

    setLoading(true)
    try {
      const res = await fetch(`/api/pools/${poolId}/members/${memberId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) setRole(newRole)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loader2 size={14} className="animate-spin text-brand-muted" />

  if (role === 'commissioner') {
    return (
      <button
        onClick={toggle}
        title="Remove co-commissioner"
        className="text-xs flex items-center gap-1 text-brand-orange hover:text-red-400 transition-colors"
      >
        <Shield size={13} />
        <span className="hidden sm:inline">Co-Commish</span>
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      title="Make co-commissioner"
      className="text-xs flex items-center gap-1 text-brand-muted hover:text-brand-orange transition-colors"
    >
      <ShieldOff size={13} />
      <span className="hidden sm:inline">Make Co-Commish</span>
    </button>
  )
}
