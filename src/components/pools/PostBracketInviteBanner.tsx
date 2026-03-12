'use client'

import { useState, useEffect } from 'react'
import { X, Share2 } from 'lucide-react'
import InviteModal from './InviteModal'

interface PostBracketInviteBannerProps {
  poolId: string
  poolName: string
  inviteCode: string
  inviteUrl: string
  inviterName?: string
  memberCount?: number
}

export default function PostBracketInviteBanner({
  poolId,
  poolName,
  inviteCode,
  inviteUrl,
  inviterName,
  memberCount,
}: PostBracketInviteBannerProps) {
  const [visible, setVisible] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Show after a short delay for better UX
    const timer = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 animate-slide-up">
        <div className="bg-brand-surface border border-brand-orange/30 rounded-2xl p-4 shadow-2xl">
          <button
            onClick={() => setVisible(false)}
            className="absolute top-3 right-3 text-brand-muted hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <div className="text-2xl">🎉</div>
            <div className="flex-1">
              <div className="font-bold text-sm mb-0.5">Bracket saved!</div>
              <p className="text-xs text-brand-muted mb-3">
                Invite friends to {poolName} and trash talk your way to the top!
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 bg-brand-orange/10 border border-brand-orange/30 text-brand-orange hover:bg-brand-orange/20 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
              >
                <Share2 size={13} />
                Invite Friends
              </button>
            </div>
          </div>
        </div>
      </div>

      <InviteModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setVisible(false) }}
        poolName={poolName}
        inviteCode={inviteCode}
        inviteUrl={inviteUrl}
        inviterName={inviterName}
        memberCount={memberCount}
      />
    </>
  )
}
