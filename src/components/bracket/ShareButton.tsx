'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import dynamic from 'next/dynamic'

// Lazy-load the share modal — it's only needed when the user clicks share
const ShareModal = dynamic(() => import('@/components/ShareModal'), { ssr: false })

interface ShareButtonProps {
  bracketId: string
  userName: string
  poolName: string
  score: number
  rank?: number
  correct?: number
  total?: number
  champion?: string
  poolStatus?: string
  isBusted?: boolean
  isWinner?: boolean
  className?: string
  label?: string
}

export default function ShareButton({
  className = 'btn-secondary flex items-center gap-2 text-sm',
  label = 'Share',
  ...props
}: ShareButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        <Share2 size={16} />
        {label}
      </button>

      <ShareModal
        isOpen={open}
        onClose={() => setOpen(false)}
        {...props}
      />
    </>
  )
}
