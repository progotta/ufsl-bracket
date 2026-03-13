'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AchievementBadge from './AchievementBadge'

const LEVELS = [
  { name: 'Rookie',       threshold: 0 },
  { name: 'Contender',    threshold: 200 },
  { name: 'Bracket Nerd', threshold: 500 },
  { name: 'Oracle',       threshold: 1000 },
  { name: 'Legend',        threshold: 2000 },
]

function getLevelInfo(xp: number) {
  let currentLevel = LEVELS[0]
  let nextLevel: (typeof LEVELS)[number] | null = LEVELS[1]

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

interface AchievementData {
  id: string
  name: string
  description: string
  emoji: string
  xp_value: number
  points: number
  rarity: string
  unlocked: boolean
  unlocked_at: string | null
}

interface AchievementsPanelProps {
  userId: string
  maxVisible?: number
}

export default function AchievementsPanel({ userId, maxVisible = 9 }: AchievementsPanelProps) {
  const [achievements, setAchievements] = useState<AchievementData[]>([])
  const [xp, setXp] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/achievements/user/${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.achievements) setAchievements(data.achievements)
        setXp(data.totalXp ?? 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
        <div className="h-8 bg-brand-border/30 rounded-xl animate-pulse mb-3" />
        <div className="flex gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-12 h-14 rounded-xl bg-brand-border/30 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const { currentLevel, nextLevel, levelIndex, xpInLevel, xpForNext, progress } = getLevelInfo(xp)

  // Sort: unlocked first (by rarity), then locked
  const rarityOrder: Record<string, number> = { legendary: 0, epic: 1, rare: 2, common: 3 }
  const sorted = [...achievements].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
    return (rarityOrder[a.rarity] ?? 4) - (rarityOrder[b.rarity] ?? 4)
  })

  const visible = sorted.slice(0, maxVisible)
  const unlockedCount = achievements.filter(a => a.unlocked).length

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
      {/* XP / Level header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-base font-black bg-brand-gradient bg-clip-text text-transparent">
            ⭐ Lv.{levelIndex + 1}
          </span>
          <span className="font-bold text-sm text-white">{currentLevel.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-brand-muted font-bold">
            {xpInLevel} / {xpForNext || '—'} XP
          </span>
          {nextLevel && (
            <span className="text-[10px] text-brand-orange font-bold">
              {nextLevel.name} →
            </span>
          )}
        </div>
      </div>

      {/* XP progress bar */}
      <div className="w-full bg-brand-border rounded-full h-2 overflow-hidden mb-3">
        <div
          className="h-full bg-brand-gradient rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Achievements header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-brand-muted font-bold">
          Achievements {unlockedCount}/{achievements.length}
        </span>
        <Link href="/achievements" className="text-xs text-brand-orange hover:underline">
          View all &rarr;
        </Link>
      </div>

      {/* Badges grid */}
      <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-9 gap-2">
        {visible.map(a => (
          <AchievementBadge
            key={a.id}
            emoji={a.emoji}
            name={a.name}
            description={a.description}
            xp={a.xp_value ?? a.points}
            earned={a.unlocked}
            size="sm"
          />
        ))}
      </div>

      {achievements.length > maxVisible && (
        <div className="text-center mt-2">
          <Link href="/achievements" className="text-xs text-brand-orange hover:underline">
            +{achievements.length - maxVisible} more
          </Link>
        </div>
      )}
    </div>
  )
}
