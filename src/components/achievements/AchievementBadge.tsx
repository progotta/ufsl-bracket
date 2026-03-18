'use client'

interface AchievementBadgeProps {
  emoji: string
  name: string
  description: string
  xp: number
  earned: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function AchievementBadge({
  emoji,
  name,
  description,
  xp,
  earned,
  size = 'md',
}: AchievementBadgeProps) {
  const sizeClasses = {
    sm: 'w-14 h-14 text-xl',
    md: 'w-20 h-20 text-2xl',
    lg: 'w-28 h-28 text-4xl',
  }

  const labelSize = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  }

  return (
    <div
      className="flex flex-col items-center gap-1.5 group cursor-default"
      title={`${name}: ${description}${earned ? ` (+${xp} XP)` : ' (Locked)'}`}
    >
      <div
        className={`
          ${sizeClasses[size]}
          rounded-2xl flex items-center justify-center
          border-2 transition-all duration-300
          ${earned
            ? 'border-brand-gold/70 bg-brand-card shadow-lg shadow-yellow-500/20 animate-badge-shimmer'
            : 'border-brand-border bg-brand-surface grayscale opacity-40'
          }
        `}
      >
        <span className={`leading-none select-none ${earned ? '' : 'opacity-60'}`} style={{fontSize:'inherit'}}>{emoji}</span>
      </div>
      <span className={`${labelSize[size]} font-bold text-center leading-tight line-clamp-1 ${earned ? 'text-white' : 'text-brand-muted'}`}>
        {name}
      </span>
      {earned && (
        <span className={`${labelSize[size]} font-bold text-brand-gold`}>+{xp} XP</span>
      )}
    </div>
  )
}
