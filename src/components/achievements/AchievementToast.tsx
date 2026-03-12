'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Achievement } from '@/lib/achievements'

const RARITY_STYLES: Record<string, { border: string; bg: string; glow: string; label: string }> = {
  common:    { border: 'border-brand-border',   bg: 'bg-brand-card',           glow: '',                       label: 'Achievement Unlocked' },
  rare:      { border: 'border-blue-500/70',    bg: 'bg-blue-950/80',          glow: 'shadow-blue-500/30',    label: '✨ Rare Achievement!' },
  epic:      { border: 'border-purple-500/70',  bg: 'bg-purple-950/80',        glow: 'shadow-purple-500/40',  label: '💥 Epic Achievement!' },
  legendary: { border: 'border-yellow-400/80',  bg: 'bg-yellow-950/80',        glow: 'shadow-yellow-400/50',  label: '🌟 Legendary Achievement!' },
}

export interface AchievementToastData {
  achievement: Achievement
}

interface AchievementToastProps {
  toast: AchievementToastData | null
  onClose: () => void
}

export default function AchievementToast({ toast, onClose }: AchievementToastProps) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  const dismiss = useCallback(() => {
    setExiting(true)
    setTimeout(() => {
      setVisible(false)
      setExiting(false)
      onClose()
    }, 400)
  }, [onClose])

  useEffect(() => {
    if (!toast) return
    setExiting(false)
    setVisible(true)

    // Auto-dismiss after 5s
    const timer = setTimeout(dismiss, 5000)
    return () => clearTimeout(timer)
  }, [toast, dismiss])

  if (!toast || !visible) return null

  const rarity = RARITY_STYLES[toast.achievement.rarity] ?? RARITY_STYLES.common

  return (
    <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none">
      <div
        onClick={dismiss}
        className={`
          pointer-events-auto cursor-pointer
          max-w-sm w-full
          ${rarity.bg} border ${rarity.border}
          rounded-2xl p-4 shadow-2xl ${rarity.glow}
          flex items-center gap-4
          transition-all duration-400
          ${exiting
            ? 'opacity-0 translate-y-4 scale-95'
            : 'opacity-100 translate-y-0 scale-100 animate-slide-up'
          }
        `}
      >
        {/* Emoji with pulse ring for legendary/epic */}
        <div className="relative flex-shrink-0">
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl bg-brand-surface ${
              toast.achievement.rarity === 'legendary'
                ? 'ring-2 ring-yellow-400/60 animate-pulse'
                : toast.achievement.rarity === 'epic'
                ? 'ring-2 ring-purple-500/50'
                : ''
            }`}
          >
            {toast.achievement.emoji}
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-brand-orange tracking-wide uppercase mb-0.5">
            🏆 {rarity.label}
          </p>
          <p className="font-black text-white text-base leading-tight truncate">
            {toast.achievement.name}
          </p>
          <p className="text-xs text-brand-muted mt-0.5 line-clamp-2 leading-snug">
            {toast.achievement.description}
          </p>
          <p className="text-xs font-bold text-brand-gold mt-1">+{toast.achievement.xp_value ?? toast.achievement.points} XP</p>
        </div>

        {/* Close hint */}
        <button
          onClick={(e) => { e.stopPropagation(); dismiss() }}
          className="text-brand-muted hover:text-white transition-colors text-lg leading-none self-start flex-shrink-0"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// ─── Context + Hook ───────────────────────────────────────────────────────────

import { createContext, useContext, useRef } from 'react'

interface AchievementToastContextValue {
  showAchievement: (achievement: Achievement) => void
}

const AchievementToastContext = createContext<AchievementToastContextValue>({
  showAchievement: () => {},
})

export function AchievementToastProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Achievement[]>([])
  const [current, setCurrent] = useState<AchievementToastData | null>(null)
  const processingRef = useRef(false)

  const showAchievement = useCallback((achievement: Achievement) => {
    setQueue(q => [...q, achievement])
  }, [])

  // Process queue one at a time
  useEffect(() => {
    if (current || !queue.length) return
    const [next, ...rest] = queue
    setQueue(rest)
    setCurrent({ achievement: next })
  }, [queue, current])

  const handleClose = useCallback(() => {
    setCurrent(null)
  }, [])

  return (
    <AchievementToastContext.Provider value={{ showAchievement }}>
      {children}
      <AchievementToast toast={current} onClose={handleClose} />
    </AchievementToastContext.Provider>
  )
}

export function useAchievementToast() {
  return useContext(AchievementToastContext)
}
