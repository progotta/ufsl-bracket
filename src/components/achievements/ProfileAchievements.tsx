'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AchievementCard from './AchievementCard'
import type { Achievement } from '@/lib/achievements'

interface AchievementWithStatus extends Achievement {
  unlocked: boolean
  unlocked_at: string | null
}

interface ProfileAchievementsProps {
  userId: string
  compact?: boolean // show only top row, no heading
}

export default function ProfileAchievements({ userId, compact = false }: ProfileAchievementsProps) {
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPoints, setTotalPoints] = useState(0)

  useEffect(() => {
    fetch(`/api/achievements?userId=${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.achievements) {
          setAchievements(data.achievements)
          setTotalPoints(data.totalPoints ?? 0)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [userId])

  const unlocked = achievements.filter(a => a.unlocked)
  // Prioritise: legendary → epic → rare → common, then most recent
  const showcase = [...unlocked]
    .sort((a, b) => {
      const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 }
      const ra = rarityOrder[a.rarity as keyof typeof rarityOrder] ?? 4
      const rb = rarityOrder[b.rarity as keyof typeof rarityOrder] ?? 4
      if (ra !== rb) return ra - rb
      return new Date(b.unlocked_at ?? 0).getTime() - new Date(a.unlocked_at ?? 0).getTime()
    })
    .slice(0, compact ? 5 : 5)

  if (loading) {
    return (
      <div className="flex gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-16 h-20 rounded-xl bg-brand-border/30 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!compact) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base">Achievements</h3>
            <p className="text-xs text-brand-muted mt-0.5">
              {unlocked.length}/{achievements.length} unlocked · {totalPoints} pts
            </p>
          </div>
          <Link
            href="/achievements"
            className="text-xs text-brand-orange hover:underline"
          >
            View all →
          </Link>
        </div>

        {showcase.length === 0 ? (
          <div className="text-center py-6 text-brand-muted text-sm">
            <div className="text-3xl mb-2">🏅</div>
            No achievements yet — start playing!
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {showcase.map(a => (
              <AchievementCard key={a.id} achievement={a} size="sm" />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Compact: just the badges row
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {showcase.length === 0 && (
        <span className="text-xs text-brand-muted">No achievements yet</span>
      )}
      {showcase.map(a => (
        <AchievementCard key={a.id} achievement={a} size="sm" />
      ))}
      {unlocked.length > 5 && (
        <Link href="/achievements" className="text-xs text-brand-orange hover:underline ml-1">
          +{unlocked.length - 5} more
        </Link>
      )}
    </div>
  )
}
