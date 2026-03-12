'use client'

import { Users } from 'lucide-react'
import type { CrowdPickResult } from '@/lib/predictions'

interface CrowdPicksProps {
  crowdPicks: CrowdPickResult
  team1Name: string
  team2Name: string
  compact?: boolean
}

export default function CrowdPicks({
  crowdPicks,
  team1Name,
  team2Name,
  compact = false,
}: CrowdPicksProps) {
  const { team1Pct, team2Pct, totalPicks } = crowdPicks
  const t1Majority = team1Pct >= team2Pct

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-[9px] text-brand-muted">
        <Users size={9} className="flex-shrink-0" />
        <span>
          <span className={t1Majority ? 'text-brand-orange font-bold' : ''}>{team1Pct}%</span>
          {' '}vs{' '}
          <span className={!t1Majority ? 'text-brand-orange font-bold' : ''}>{team2Pct}%</span>
          {' '}UFSL picks
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Users size={12} className="text-brand-muted flex-shrink-0" />
        <span className="text-xs font-bold text-white">UFSL Crowd Picks</span>
        {totalPicks > 0 && (
          <span className="text-[10px] text-brand-muted">({totalPicks.toLocaleString()} brackets)</span>
        )}
      </div>

      {totalPicks === 0 ? (
        <p className="text-[10px] text-brand-muted italic text-center py-2">
          No picks submitted yet
        </p>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className={t1Majority ? 'font-bold text-brand-orange' : 'text-brand-muted'}>
              {team1Name}
            </span>
            <span className={!t1Majority ? 'font-bold text-brand-orange' : 'text-brand-muted'}>
              {team2Name}
            </span>
          </div>

          {/* Bar */}
          <div className="h-5 rounded-full overflow-hidden bg-brand-border flex relative">
            <div
              className="h-full bg-brand-orange flex items-center justify-center transition-all duration-500"
              style={{ width: `${team1Pct}%` }}
            >
              {team1Pct > 20 && (
                <span className="text-[10px] font-black text-white">{team1Pct}%</span>
              )}
            </div>
            <div className="flex-1 h-full bg-brand-muted/30 flex items-center justify-center">
              {team2Pct > 20 && (
                <span className="text-[10px] font-black text-white">{team2Pct}%</span>
              )}
            </div>
          </div>

          <div className="text-[10px] text-brand-muted text-center">
            of UFSL users picked{' '}
            <span className="text-brand-orange font-bold">
              {t1Majority ? team1Name : team2Name}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
