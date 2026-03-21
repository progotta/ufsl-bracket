'use client'

import { useMemo } from 'react'
import { useLiveScores } from '@/hooks/useLiveScores'
import { getPickSlug } from '@/lib/bracketUtils'
import type { Team, Game } from '@/types/database'
import TeamLogo from '@/components/ui/TeamLogo'

interface LivePicksRowProps {
  picks: Record<string, string>
  teams: Team[]
  /** DB games list — used to resolve the exact pick slot for each live game */
  games?: Game[]
}

export default function LivePicksRow({ picks, teams, games = [] }: LivePicksRowProps) {
  const { activeGames } = useLiveScores()

  const livePicks = useMemo(() => {
    // Build lookup maps
    const teamByEspnId = new Map(
      teams.filter(t => t.espn_id != null).map(t => [String(t.espn_id), t])
    )
    const teamById = new Map(teams.map(t => [t.id, t]))

    // Build a lookup from (team1_id, team2_id) → DB game for quick matching
    const dbGameByTeamPair = new Map<string, Game>()
    for (const g of games) {
      if (g.team1_id && g.team2_id) {
        dbGameByTeamPair.set(`${g.team1_id}|${g.team2_id}`, g)
        dbGameByTeamPair.set(`${g.team2_id}|${g.team1_id}`, g)
      }
    }

    const results: {
      teamId: string
      abbreviation: string
      espnId: number | null
      isWinning: boolean
      isTied: boolean
    }[] = []

    for (const game of activeGames) {
      // Resolve DB team objects for both sides
      const dbTeam1 =
        (game.team1.id ? teamById.get(game.team1.id) : undefined) ??
        (game.team1.espnTeamId ? teamByEspnId.get(game.team1.espnTeamId) : undefined)
      const dbTeam2 =
        (game.team2.id ? teamById.get(game.team2.id) : undefined) ??
        (game.team2.espnTeamId ? teamByEspnId.get(game.team2.espnTeamId) : undefined)

      if (!dbTeam1 || !dbTeam2) continue

      // Find the specific DB game for this matchup so we can compute the pick slot
      const dbGame = dbGameByTeamPair.get(`${dbTeam1.id}|${dbTeam2.id}`)

      let pickedTeamId: string | undefined

      if (dbGame) {
        // Best path: check the exact pick slot for this game
        const slug = getPickSlug(dbGame)
        pickedTeamId = picks[slug]
      } else {
        // Fallback: find a pick key whose value is one of the two teams,
        // preferring the higher-round key (most recently applicable pick).
        let bestRound = -1
        for (const [key, val] of Object.entries(picks)) {
          if (val !== dbTeam1.id && val !== dbTeam2.id) continue
          const roundMatch = key.match(/-r(\d+)-/)
          const round = roundMatch ? parseInt(roundMatch[1]) : 0
          if (round > bestRound) {
            bestRound = round
            pickedTeamId = val
          }
        }
      }

      if (!pickedTeamId) continue

      // Only show the team this bracket actually picked for this game
      const pickedSide = pickedTeamId === dbTeam1.id ? game.team1 : pickedTeamId === dbTeam2.id ? game.team2 : null
      if (!pickedSide) continue

      const pickedDbTeam = pickedTeamId === dbTeam1.id ? dbTeam1 : dbTeam2
      const isTied = game.team1.score === game.team2.score

      results.push({
        teamId: pickedDbTeam.id,
        abbreviation: pickedDbTeam.abbreviation ?? pickedSide.abbreviation,
        espnId: pickedDbTeam.espn_id ?? null,
        isWinning: pickedSide.isWinning,
        isTied,
      })
    }

    return results
  }, [picks, teams, games, activeGames])

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
