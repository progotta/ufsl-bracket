'use client'

import { useState } from 'react'
import Image from 'next/image'
import clsx from 'clsx'

const SIZES = {
  xs: 16,
  sm: 20,
  md: 32,
  lg: 48,
} as const

type TeamLogoSize = keyof typeof SIZES

interface TeamLogoProps {
  espnId?: number | string | null
  teamName: string
  size?: TeamLogoSize
  className?: string
}

function getInitials(name: string): string {
  const words = name.replace(/[()]/g, '').split(/\s+/)
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function TeamLogo({ espnId, teamName, size = 'sm', className }: TeamLogoProps) {
  const [failed, setFailed] = useState(false)
  const px = SIZES[size]

  if (!espnId || failed) {
    return (
      <span
        className={clsx(
          'inline-flex items-center justify-center rounded-sm bg-brand-border/60 text-brand-muted font-bold flex-shrink-0',
          size === 'xs' && 'text-[6px]',
          size === 'sm' && 'text-[7px]',
          size === 'md' && 'text-[9px]',
          size === 'lg' && 'text-xs',
          className
        )}
        style={{ width: px, height: px }}
        title={teamName}
        aria-label={teamName}
      >
        {getInitials(teamName)}
      </span>
    )
  }

  return (
    <Image
      src={`https://a.espncdn.com/i/teamlogos/ncaa/500/${espnId}.png`}
      alt={teamName}
      width={px}
      height={px}
      unoptimized
      className={clsx('rounded-sm flex-shrink-0 object-contain', className)}
      onError={() => setFailed(true)}
    />
  )
}
