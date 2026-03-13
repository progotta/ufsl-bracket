'use client'

import { Share2 } from 'lucide-react'

export default function PoolInviteLink({ inviteUrl }: { inviteUrl: string }) {
  return (
    <a
      href={inviteUrl}
      onClick={e => e.stopPropagation()}
      className="text-[10px] text-brand-orange hover:underline flex items-center gap-1"
    >
      <Share2 size={10} /> Invite
    </a>
  )
}
