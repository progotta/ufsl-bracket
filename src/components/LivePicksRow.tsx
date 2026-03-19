'use client'

import { useMemo } from 'react'
import { useLiveScores } from '@/hooks/useLiveScores'
import type { Team } from '@/types/database'
import TeamLogo from '@/components/ui/TeamLogo'

interface LivePicksRowProps {
  picks: Record<string, string>
  teams: Team[]
}

export default function LivePicksRow({ picks, teams }: LivePicksRowProps) {
  const { activeGames } = useLiveScores()

  const livePicks = useMemo(() => {
    const pickedIds = new Set(Object.values(picks))
    const teamMap = new Map(teams.map(t => [t.id, t]))

    const results: {
      teamId: string
      abbreviation: string
      espnId: number | null
      isWinning: boolean
      isTied: boolean
    }[] = []

    for (const game of activeGames) {
      for (const side of [game.team1, game.team2] as const) {
        if (side.id && pickedIds.has(side.id)) {
          const dbTeam = teamMap.get(side.id)
          results.push({
            teamId: side.id,
            abbreviation: dbTeam?.abbreviation ?? side.abbreviation,
            espnId: dbTeam?.espn_id ?? null,
            isWinning: side.isWinning,
            isTied: game.team1.score === game.team2.score,
          })
        }
      }
    }

    return results
  }, [picks, teams, activeGames])

  if (livePicks.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {livePicks.map(({ teamId, abbreviation, espnId, isWinning, isTied }) => {
        const colorClass = isTied
          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
          : isWinning
            ? 'bg-green-500/20 text-green-400 border-green-500/30'
            : 'bg-red-500/20 text-red-400 border-red-500/30'

        return (
          <span
            key={teamId}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-semibold ${colorClass}`}
          >
            <TeamLogo espnId={espnId} teamName={abbreviation} size="xs" />
            {abbreviation}
          </span>
        )
      })}
    </div>
  )
}
