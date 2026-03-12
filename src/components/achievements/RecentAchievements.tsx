'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Achievement } from '@/lib/achievements'

interface AchievementWithStatus extends Achievement {
  unlocked: boolean
  unlocked_at: string | null
}

const RARITY_STYLES: Record<string, { border: string; label: string; labelColor: string }> = {
  common:    { border: 'border-brand-border',    label: 'Common',    labelColor: 'text-brand-muted' },
  rare:      { border: 'border-blue-500/50',     label: 'Rare',      labelColor: 'text-blue-400' },
  epic:      { border: 'border-purple-500/50',   label: 'Epic',      labelColor: 'text-purple-400' },
  legendary: { border: 'border-yellow-400/60',   label: 'Legendary', labelColor: 'text-yellow-400' },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function RecentAchievements({ userId }: { userId: string }) {
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/achievements?userId=${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.achievements) {
          const unlocked = (data.achievements as AchievementWithStatus[])
            .filter(a => a.unlocked && a.unlocked_at)
            .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime())
            .slice(0, 4)
          setAchievements(unlocked)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [userId])

  if (loading) return null
  if (!achievements.length) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">Recent Achievements</h2>
        <Link href="/achievements" className="text-brand-orange text-sm hover:underline">
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {achievements.map(a => {
          const rarity = RARITY_STYLES[a.rarity] ?? RARITY_STYLES.common
          return (
            <div
              key={a.id}
              className={`flex items-center gap-4 bg-brand-surface border ${rarity.border} rounded-xl p-4`}
            >
              <div className="w-12 h-12 rounded-xl bg-brand-card flex items-center justify-center text-2xl flex-shrink-0">
                {a.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">{a.name}</div>
                <div className="text-xs text-brand-muted truncate">{a.description}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-bold ${rarity.labelColor}`}>{rarity.label}</span>
                  <span className="text-xs text-brand-muted">·</span>
                  <span className="text-xs text-brand-muted">{timeAgo(a.unlocked_at!)}</span>
                </div>
              </div>
              <div className="text-brand-gold font-bold text-sm flex-shrink-0">+{a.points}</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
