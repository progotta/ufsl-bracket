'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, BarChart2 } from 'lucide-react'
import WinProbabilityBar from './WinProbabilityBar'
import BettingOdds from './BettingOdds'
import SeedStats from './SeedStats'
import CrowdPicks from './CrowdPicks'
import {
  getTeamPrediction,
  getMockOddsForMatchup,
  getSeedMatchupStat,
  computeCrowdPicks,
  type CrowdPickResult,
} from '@/lib/predictions'
import type { BracketTeam } from '@/lib/bracket'

interface MatchupInsightsProps {
  team1: BracketTeam
  team2: BracketTeam
  gameId: string
  allBracketPicks?: Record<string, string>[]  // from crowd picks query
  crowdPicks?: CrowdPickResult                 // pre-computed crowd picks
  compact?: boolean                            // inline mode in bracket
  defaultExpanded?: boolean
}

export default function MatchupInsights({
  team1,
  team2,
  gameId,
  allBracketPicks,
  crowdPicks: crowdPicksProp,
  compact = false,
  defaultExpanded = false,
}: MatchupInsightsProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const t1Pred = getTeamPrediction(team1.id)
  const t2Pred = getTeamPrediction(team2.id)

  const favTeam = (t1Pred?.winProbability ?? 50) >= (t2Pred?.winProbability ?? 50) ? team1 : team2
  const favSeed = Math.min(team1.seed, team2.seed)
  const dogSeed = Math.max(team1.seed, team2.seed)

  const odds = getMockOddsForMatchup(
    favTeam.id,
    favTeam.abbreviation,
    favSeed,
    dogSeed,
    favTeam.id === team1.id
      ? (t1Pred?.winProbability ?? 60)
      : (t2Pred?.winProbability ?? 60)
  )

  const seedStat = getSeedMatchupStat(team1.seed, team2.seed)

  const crowdPicks = crowdPicksProp ?? (allBracketPicks
    ? computeCrowdPicks(allBracketPicks, gameId, team1.id, team2.id)
    : undefined)

  if (compact) {
    return (
      <div className="px-2 pb-1.5 space-y-0.5">
        {/* Win probability */}
        {t1Pred && t2Pred && (
          <WinProbabilityBar
            team1Prediction={t1Pred}
            team2Prediction={t2Pred}
            team1Name={team1.abbreviation}
            team2Name={team2.abbreviation}
            compact
          />
        )}
        {/* Seed stat */}
        {seedStat && <SeedStats stat={seedStat} compact />}
        {/* Crowd picks */}
        {crowdPicks && (
          <CrowdPicks
            crowdPicks={crowdPicks}
            team1Name={team1.abbreviation}
            team2Name={team2.abbreviation}
            compact
          />
        )}
      </div>
    )
  }

  return (
    <div className="border border-brand-border rounded-xl overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 bg-brand-card hover:bg-brand-card/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BarChart2 size={14} className="text-brand-orange" />
          <span className="text-sm font-bold text-white">Matchup Insights</span>
          <span className="text-[10px] text-brand-muted bg-brand-border rounded px-1.5 py-0.5">
            {team1.abbreviation} vs {team2.abbreviation}
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-brand-muted" />
        ) : (
          <ChevronDown size={14} className="text-brand-muted" />
        )}
      </button>

      {expanded && (
        <div className="p-4 space-y-4 bg-brand-dark/50">
          {/* Win Probability */}
          {t1Pred && t2Pred && (
            <WinProbabilityBar
              team1Prediction={t1Pred}
              team2Prediction={t2Pred}
              team1Name={team1.name}
              team2Name={team2.name}
            />
          )}

          {/* Betting Odds */}
          <BettingOdds
            odds={odds}
            team1Name={team1.name}
            team2Name={team2.name}
          />

          {/* Historical Seed Stats */}
          {seedStat && <SeedStats stat={seedStat} />}

          {/* Crowd Picks */}
          {crowdPicks && (
            <CrowdPicks
              crowdPicks={crowdPicks}
              team1Name={team1.name}
              team2Name={team2.name}
            />
          )}
        </div>
      )}
    </div>
  )
}
