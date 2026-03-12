'use client'

import { formatMoneyline } from '@/lib/predictions'
import type { GameOdds } from '@/lib/predictions'

interface BettingOddsProps {
  odds: GameOdds
  team1Name: string
  team2Name: string
  compact?: boolean
}

export default function BettingOdds({
  odds,
  team1Name,
  team2Name,
  compact = false,
}: BettingOddsProps) {
  const favName = odds.favoriteTeamId ? team1Name : team2Name // simplified — component caller sets correct order
  const dogName = odds.favoriteTeamId ? team2Name : team1Name

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[10px] text-brand-muted">
        <span className="text-yellow-400 font-bold">{odds.spreadLabel}</span>
        {odds.overUnder && (
          <span>O/U {odds.overUnder}</span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white">Betting Lines</span>
        <span className="text-[10px] text-brand-muted">{odds.booksSource}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Spread */}
        <div className="bg-brand-card border border-brand-border rounded-lg p-2 text-center">
          <div className="text-[10px] text-brand-muted uppercase tracking-wide mb-1">Spread</div>
          <div className="text-sm font-black text-yellow-400">{odds.spreadLabel}</div>
        </div>

        {/* O/U */}
        {odds.overUnder && (
          <div className="bg-brand-card border border-brand-border rounded-lg p-2 text-center">
            <div className="text-[10px] text-brand-muted uppercase tracking-wide mb-1">Over/Under</div>
            <div className="text-sm font-black text-white">{odds.overUnder}</div>
          </div>
        )}
      </div>

      {/* Moneyline */}
      <div className="bg-brand-card border border-brand-border rounded-lg p-2">
        <div className="text-[10px] text-brand-muted uppercase tracking-wide mb-2">Moneyline</div>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-[10px] text-brand-muted truncate max-w-[80px]">{team1Name}</div>
            <div className="text-sm font-black text-white">{formatMoneyline(odds.moneylineFav)}</div>
          </div>
          <div className="text-brand-muted text-xs font-bold">vs</div>
          <div className="text-center">
            <div className="text-[10px] text-brand-muted truncate max-w-[80px]">{team2Name}</div>
            <div className="text-sm font-black text-white">{formatMoneyline(odds.moneylineDog)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
