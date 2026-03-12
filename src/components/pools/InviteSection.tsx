'use client'

import { useState } from 'react'
import { Users, Link as LinkIcon } from 'lucide-react'
import InviteModal from './InviteModal'

interface InviteSectionProps {
  poolName: string
  inviteCode: string
  inviteUrl: string
  inviterName?: string
  memberCount?: number
  bracketType?: string
}

export default function InviteSection({
  poolName,
  inviteCode,
  inviteUrl,
  inviterName,
  memberCount,
  bracketType,
}: InviteSectionProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="space-y-3">
        <div className="bg-brand-card rounded-xl p-3 flex items-center gap-2">
          <LinkIcon size={13} className="text-brand-muted shrink-0" />
          <code className="text-xs text-brand-muted flex-1 truncate">{inviteUrl}</code>
        </div>
        <div className="flex gap-2">
          <div className="bg-brand-card border border-brand-border rounded-lg px-3 py-2 flex-1 text-center">
            <div className="text-xl font-black text-brand-gold tracking-widest">{inviteCode}</div>
            <div className="text-xs text-brand-muted">Invite Code</div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-brand-orange/10 border border-brand-orange/30 rounded-lg px-4 py-2 text-sm font-medium text-brand-orange hover:bg-brand-orange/20 transition-colors"
          >
            <Users size={16} />
            Invite
          </button>
        </div>
      </div>

      <InviteModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        poolName={poolName}
        inviteCode={inviteCode}
        inviteUrl={inviteUrl}
        inviterName={inviterName}
        memberCount={memberCount}
        bracketType={bracketType}
      />
    </>
  )
}
