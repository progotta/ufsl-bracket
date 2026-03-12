'use client'

import { useState, useMemo } from 'react'
import AchievementCard from '@/components/achievements/AchievementCard'
import type { Achievement } from '@/lib/achievements'

type AchievementWithStatus = Achievement & {
  unlocked: boolean
  unlocked_at: string | null
}

type CategoryFilter = 'all' | Achievement['category']
type StatusFilter = 'all' | 'unlocked' | 'locked'

const CATEGORIES: { value: CategoryFilter; label: string; emoji: string }[] = [
  { value: 'all',     label: 'All',     emoji: '🏅' },
  { value: 'picks',   label: 'Picks',   emoji: '🎯' },
  { value: 'streaks', label: 'Streaks', emoji: '🔥' },
  { value: 'social',  label: 'Social',  emoji: '💬' },
  { value: 'pools',   label: 'Pools',   emoji: '🏆' },
  { value: 'special', label: 'Special', emoji: '✨' },
]

const RARITY_ORDER = { legendary: 0, epic: 1, rare: 2, common: 3 }

interface AchievementsGridProps {
  achievements: AchievementWithStatus[]
  totalPoints: number
  totalCount: number
  unlockedCount: number
}

export default function AchievementsGrid({
  achievements,
  totalPoints,
  totalCount,
  unlockedCount,
}: AchievementsGridProps) {
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')

  const filtered = useMemo(() => {
    return achievements
      .filter(a => category === 'all' || a.category === category)
      .filter(a => {
        if (status === 'unlocked') return a.unlocked
        if (status === 'locked') return !a.unlocked
        return true
      })
      .sort((a, b) => {
        // Unlocked first, then by rarity
        if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
        const ra = RARITY_ORDER[a.rarity as keyof typeof RARITY_ORDER] ?? 4
        const rb = RARITY_ORDER[b.rarity as keyof typeof RARITY_ORDER] ?? 4
        return ra - rb
      })
  }, [achievements, category, status])

  const progressPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black mb-1">
          🏅 Achievements
        </h1>
        <p className="text-brand-muted text-sm">Earn badges by playing, competing, and talking trash.</p>
      </div>

      {/* Stats bar */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
        <div className="flex flex-wrap gap-6 mb-4">
          <div>
            <div className="text-3xl font-black text-brand-orange">{unlockedCount}<span className="text-brand-muted text-lg font-bold">/{totalCount}</span></div>
            <div className="text-xs text-brand-muted mt-0.5">Achievements Unlocked</div>
          </div>
          <div>
            <div className="text-3xl font-black text-brand-gold">{totalPoints}</div>
            <div className="text-xs text-brand-muted mt-0.5">Achievement Points</div>
          </div>
          <div>
            <div className="text-3xl font-black">{progressPct}<span className="text-brand-muted text-lg font-bold">%</span></div>
            <div className="text-xs text-brand-muted mt-0.5">Completion</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-brand-border rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full bg-brand-gradient rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Category tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                category === c.value
                  ? 'bg-brand-orange text-white'
                  : 'bg-brand-surface border border-brand-border text-brand-muted hover:text-white hover:border-brand-orange/40'
              }`}
            >
              <span>{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1.5 sm:ml-auto">
          {(['all', 'unlocked', 'locked'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                status === s
                  ? 'bg-brand-card border border-brand-orange/50 text-white'
                  : 'bg-brand-surface border border-brand-border text-brand-muted hover:text-white'
              }`}
            >
              {s === 'all' ? 'All' : s === 'unlocked' ? '✅ Unlocked' : '🔒 Locked'}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-brand-muted">
        Showing {filtered.length} achievement{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-brand-muted">
          <div className="text-4xl mb-3">🤷</div>
          <p className="font-medium">No achievements match this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(a => (
            <AchievementCard key={a.id} achievement={a} />
          ))}
        </div>
      )}
    </div>
  )
}
