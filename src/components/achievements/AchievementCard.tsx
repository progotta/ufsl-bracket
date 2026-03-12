'use client'

import type { Achievement } from '@/lib/achievements'

const RARITY_STYLES: Record<string, { border: string; glow: string; label: string; labelColor: string }> = {
  common:    { border: 'border-brand-border',    glow: '',                          label: 'Common',    labelColor: 'text-brand-muted' },
  rare:      { border: 'border-blue-500/60',     glow: 'shadow-blue-500/10',       label: 'Rare',      labelColor: 'text-blue-400' },
  epic:      { border: 'border-purple-500/60',   glow: 'shadow-purple-500/15',     label: 'Epic',      labelColor: 'text-purple-400' },
  legendary: { border: 'border-yellow-400/70',   glow: 'shadow-yellow-400/20',     label: 'Legendary', labelColor: 'text-yellow-400' },
}

const CATEGORY_LABEL: Record<string, string> = {
  picks:   'Picks',
  social:  'Social',
  pools:   'Pools',
  streaks: 'Streaks',
  special: 'Special',
}

interface AchievementCardProps {
  achievement: Achievement & {
    unlocked: boolean
    unlocked_at: string | null
  }
  size?: 'sm' | 'md'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AchievementCard({ achievement, size = 'md' }: AchievementCardProps) {
  const rarity = RARITY_STYLES[achievement.rarity] ?? RARITY_STYLES.common
  const locked = !achievement.unlocked

  if (size === 'sm') {
    return (
      <div
        title={`${achievement.name}: ${achievement.description}`}
        className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border ${rarity.border} ${
          locked ? 'opacity-40 grayscale' : `shadow-lg ${rarity.glow}`
        } bg-brand-card transition-all hover:scale-105 cursor-default`}
      >
        <span className="text-2xl">{achievement.emoji}</span>
        <span className="text-xs font-semibold text-center leading-tight line-clamp-1">{achievement.name}</span>
        {!locked && (
          <span className={`text-[10px] font-bold ${rarity.labelColor}`}>{rarity.label}</span>
        )}
      </div>
    )
  }

  return (
    <div
      className={`relative flex gap-4 p-4 rounded-2xl border ${rarity.border} ${
        locked
          ? 'opacity-45 grayscale bg-brand-surface'
          : `bg-brand-card shadow-lg ${rarity.glow}`
      } transition-all`}
    >
      {/* Emoji badge */}
      <div
        className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${
          locked ? 'bg-brand-border/20' : 'bg-brand-surface'
        }`}
      >
        {locked && achievement.secret ? '🔒' : achievement.emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <h3 className={`font-bold text-sm leading-tight ${locked ? 'text-brand-muted' : 'text-white'}`}>
              {achievement.secret && locked ? '???' : achievement.name}
            </h3>
            <p className="text-xs text-brand-muted mt-0.5 leading-snug">
              {achievement.secret && locked ? 'Secret achievement — keep playing to discover it' : achievement.description}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className={`text-xs font-bold ${rarity.labelColor}`}>{rarity.label}</span>
            {!locked && (
              <span className="text-xs font-bold text-brand-orange">+{achievement.points} pts</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full bg-brand-surface border border-brand-border ${
            locked ? 'text-brand-muted/60' : 'text-brand-muted'
          }`}>
            {CATEGORY_LABEL[achievement.category] ?? achievement.category}
          </span>
          {achievement.unlocked_at && !locked && (
            <span className="text-xs text-brand-muted/70">
              Unlocked {formatDate(achievement.unlocked_at)}
            </span>
          )}
          {locked && (
            <span className="text-xs text-brand-muted/50 flex items-center gap-1">
              🔒 Locked
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
