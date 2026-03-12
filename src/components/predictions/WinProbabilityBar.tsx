'use client'

import clsx from 'clsx'
import type { TeamPrediction } from '@/lib/predictions'

interface WinProbabilityBarProps {
  team1Prediction?: TeamPrediction
  team2Prediction?: TeamPrediction
  team1Name: string
  team2Name: string
  compact?: boolean
}

export default function WinProbabilityBar({
  team1Prediction,
  team2Prediction,
  team1Name,
  team2Name,
  compact = false,
}: WinProbabilityBarProps) {
  const t1 = team1Prediction?.winProbability ?? 50
  const t2 = team2Prediction?.winProbability ?? 50
  const total = t1 + t2
  const t1Pct = Math.round((t1 / total) * 100)
  const t2Pct = 100 - t1Pct
  const source = team1Prediction?.source ?? team2Prediction?.source ?? 'FiveThirtyEight'
  const t1Favored = t1 >= t2

  if (compact) {
    // Minimal inline version for bracket slots
    return (
      <div className="flex items-center gap-1 mt-0.5">
        <span
          className={clsx(
            'text-[9px] font-bold',
            t1Favored ? 'text-green-400' : 'text-brand-muted'
          )}
        >
          {t1Pct}%
        </span>
        <div className="flex-1 h-1 rounded-full overflow-hidden bg-brand-border">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${t1Pct}%` }}
          />
        </div>
        <span
          className={clsx(
            'text-[9px] font-bold',
            !t1Favored ? 'text-green-400' : 'text-brand-muted'
          )}
        >
          {t2Pct}%
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className={clsx('font-bold truncate max-w-[40%]', t1Favored ? 'text-green-400' : 'text-brand-muted')}>
          {team1Name}
        </span>
        <span className="text-brand-muted text-[10px]">Win Probability</span>
        <span className={clsx('font-bold truncate max-w-[40%] text-right', !t1Favored ? 'text-green-400' : 'text-brand-muted')}>
          {team2Name}
        </span>
      </div>

      {/* Bar */}
      <div className="relative h-4 rounded-full overflow-hidden bg-brand-border flex">
        <div
          className="h-full bg-gradient-to-r from-green-600 to-green-400 flex items-center justify-center transition-all duration-500"
          style={{ width: `${t1Pct}%` }}
        >
          {t1Pct > 15 && (
            <span className="text-[10px] font-black text-white drop-shadow">{t1Pct}%</span>
          )}
        </div>
        <div className="flex-1 h-full bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center">
          {t2Pct > 15 && (
            <span className="text-[10px] font-black text-white drop-shadow">{t2Pct}%</span>
          )}
        </div>
      </div>

      <div className="text-[10px] text-brand-muted text-center">
        via {source}
      </div>
    </div>
  )
}
