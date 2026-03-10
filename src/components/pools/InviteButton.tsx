'use client'

import { useState } from 'react'
import { Copy, Check, Share2 } from 'lucide-react'

interface InviteButtonProps {
  inviteUrl: string
  inviteCode: string
}

export default function InviteButton({ inviteUrl, inviteCode }: InviteButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my UFSL Bracket Pool!',
          text: `Join my bracket pool! Use code: ${inviteCode}`,
          url: inviteUrl,
        })
      } catch {
        handleCopy()
      }
    } else {
      handleCopy()
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 bg-brand-card border border-brand-border rounded-lg px-4 py-2 text-sm font-medium hover:border-brand-orange transition-colors"
      >
        {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <button
        onClick={handleShare}
        className="flex items-center gap-2 bg-brand-orange/10 border border-brand-orange/30 rounded-lg px-4 py-2 text-sm font-medium text-brand-orange hover:bg-brand-orange/20 transition-colors"
      >
        <Share2 size={16} />
        Share
      </button>
    </div>
  )
}
