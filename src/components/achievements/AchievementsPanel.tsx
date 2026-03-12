'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AchievementBadge from './AchievementBadge'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/achievements/user/${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.achievements) setAchievements(data.achievements)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
        <div className="flex gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-20 h-24 rounded-2xl bg-brand-border/30 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Sort: unlocked first (by rarity), then locked
  const rarityOrder: Record<string, number> = { legendary: 0, epic: 1, rare: 2, common: 3 }
  const sorted = [...achievements].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
    return (rarityOrder[a.rarity] ?? 4) - (rarityOrder[b.rarity] ?? 4)
  })

  const visible = sorted.slice(0, maxVisible)
  const unlockedCount = achievements.filter(a => a.unlocked).length

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-base">Achievements</h3>
          <p className="text-xs text-brand-muted mt-0.5">
            {unlockedCount}/{achievements.length} unlocked
          </p>
        </div>
        <Link href="/achievements" className="text-xs text-brand-orange hover:underline">
          View all &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
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
        <div className="text-center mt-4">
          <Link href="/achievements" className="text-xs text-brand-orange hover:underline">
            +{achievements.length - maxVisible} more achievements
          </Link>
        </div>
      )}
    </div>
  )
}
