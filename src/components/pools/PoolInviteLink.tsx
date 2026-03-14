'use client'

import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'

export default function PoolInviteLink({ inviteUrl }: { inviteUrl: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = inviteUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="text-[10px] text-brand-orange hover:underline flex items-center gap-1"
    >
      {copied ? (
        <>
          <Check size={10} className="text-green-400" />
          <span className="text-green-400">Copied!</span>
        </>
      ) : (
        <>
          <Copy size={10} /> Copy link
        </>
      )}
    </button>
  )
}
