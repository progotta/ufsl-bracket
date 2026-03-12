'use client'

import { TrendingUp, AlertTriangle, Info } from 'lucide-react'
import type { SeedMatchupStat } from '@/lib/predictions'

interface SeedStatsProps {
  stat: SeedMatchupStat
  compact?: boolean
}

export default function SeedStats({ stat, compact = false }: SeedStatsProps) {
  const isUpset = stat.higherSeedWinPct < 70

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-[9px]">
        {isUpset ? (
          <AlertTriangle size={9} className="text-orange-400 flex-shrink-0" />
        ) : (
          <TrendingUp size={9} className="text-brand-muted flex-shrink-0" />
        )}
        <span className={isUpset ? 'text-orange-400' : 'text-brand-muted'}>
          {stat.higherSeedWinPct < 50
            ? `Upset alert! ${100 - stat.higherSeedWinPct}% upset rate`
            : `${stat.higherSeedWinPct}% fav wins`}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Info size={12} className="text-brand-muted flex-shrink-0" />
        <span className="text-xs font-bold text-white">Historical Seed Stats</span>
      </div>

      <div className="bg-brand-card border border-brand-border rounded-lg p-3 space-y-2">
        {/* Win % bar */}
        <div>
          <div className="flex items-center justify-between text-[10px] text-brand-muted mb-1">
            <span>#{stat.seed1} seed</span>
            <span>#{stat.seed2} seed</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden bg-brand-border flex">
            <div
              className="h-full bg-brand-orange transition-all"
              style={{ width: `${stat.higherSeedWinPct}%` }}
            />
            <div className="flex-1 h-full bg-brand-muted/30" />
          </div>
          <div className="flex items-center justify-between text-[10px] mt-0.5">
            <span className="font-bold text-brand-orange">{stat.higherSeedWinPct}%</span>
            <span className="text-brand-muted">{(100 - stat.higherSeedWinPct).toFixed(1)}%</span>
          </div>
        </div>

        {/* Label */}
        <p className={`text-xs font-semibold ${isUpset ? 'text-orange-400' : 'text-white'}`}>
          {isUpset && <AlertTriangle size={10} className="inline mr-1" />}
          {stat.label}
        </p>

        {/* Note */}
        {stat.note && (
          <p className="text-[10px] text-brand-muted italic">{stat.note}</p>
        )}

        {/* Sample size */}
        <p className="text-[10px] text-brand-muted">
          Based on {stat.sampleSize} tournament games (1985–2024) · {stat.upsets} upsets
        </p>
      </div>
    </div>
  )
}
