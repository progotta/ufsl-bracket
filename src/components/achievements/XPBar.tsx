'use client'

import { useEffect, useState } from 'react'

const LEVELS = [
  { name: 'Rookie',       threshold: 0 },
  { name: 'Contender',    threshold: 200 },
  { name: 'Bracket Nerd', threshold: 500 },
  { name: 'Oracle',       threshold: 1000 },
  { name: 'Legend',        threshold: 2000 },
]

function getLevelInfo(xp: number) {
  let currentLevel = LEVELS[0]
  let nextLevel = LEVELS[1]

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].threshold) {
      currentLevel = LEVELS[i]
      nextLevel = LEVELS[i + 1] ?? null
      break
    }
  }

  const levelIndex = LEVELS.indexOf(currentLevel)
  const xpInLevel = xp - currentLevel.threshold
  const xpForNext = nextLevel ? nextLevel.threshold - currentLevel.threshold : 0
  const progress = nextLevel ? Math.min(100, (xpInLevel / xpForNext) * 100) : 100

  return { currentLevel, nextLevel, levelIndex, xpInLevel, xpForNext, progress }
}

interface XPBarProps {
  userId: string
}

export default function XPBar({ userId }: XPBarProps) {
  const [xp, setXp] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/achievements/user/${userId}`)
      .then(r => r.json())
      .then(data => {
        setXp(data.totalXp ?? 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
        <div className="h-12 bg-brand-border/30 rounded-xl animate-pulse" />
      </div>
    )
  }

  const { currentLevel, nextLevel, levelIndex, xpInLevel, xpForNext, progress } = getLevelInfo(xp)

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black bg-brand-gradient bg-clip-text text-transparent">
            Lv.{levelIndex + 1}
          </span>
          <span className="font-bold text-sm text-white">{currentLevel.name}</span>
        </div>
        <span className="text-xs text-brand-muted font-bold">{xp} XP</span>
      </div>

      <div className="w-full bg-brand-border rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-brand-gradient rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-brand-muted">{currentLevel.name}</span>
        {nextLevel ? (
          <span className="text-[10px] text-brand-muted">
            {xpInLevel}/{xpForNext} XP to {nextLevel.name}
          </span>
        ) : (
          <span className="text-[10px] text-brand-gold font-bold">MAX LEVEL</span>
        )}
      </div>
    </div>
  )
}
