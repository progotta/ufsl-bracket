import { NextRequest, NextResponse } from 'next/server'
import {
  getTeamPrediction,
  getMockOddsForMatchup,
  getSeedMatchupStat,
} from '@/lib/predictions'

/**
 * GET /api/predictions?team1Id=e1&team2Id=e16&seed1=1&seed2=16
 *
 * Returns combined prediction data for a matchup:
 *  - Win probabilities for both teams
 *  - Betting odds (mock or live via The Odds API)
 *  - Historical seed matchup stat
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const team1Id = searchParams.get('team1Id')
  const team2Id = searchParams.get('team2Id')
  const seed1Str = searchParams.get('seed1')
  const seed2Str = searchParams.get('seed2')
  const team1Name = searchParams.get('team1Name') ?? 'Team 1'
  const team2Name = searchParams.get('team2Name') ?? 'Team 2'

  if (!team1Id || !team2Id) {
    return NextResponse.json(
      { error: 'Missing required params: team1Id, team2Id' },
      { status: 400 }
    )
  }

  const seed1 = seed1Str ? parseInt(seed1Str) : undefined
  const seed2 = seed2Str ? parseInt(seed2Str) : undefined

  const team1Prediction = getTeamPrediction(team1Id)
  const team2Prediction = getTeamPrediction(team2Id)

  const favTeamId =
    (team1Prediction?.winProbability ?? 50) >= (team2Prediction?.winProbability ?? 50)
      ? team1Id
      : team2Id

  const odds =
    seed1 && seed2
      ? getMockOddsForMatchup(
          favTeamId,
          favTeamId === team1Id ? team1Name : team2Name,
          Math.min(seed1, seed2),
          Math.max(seed1, seed2),
          favTeamId === team1Id
            ? (team1Prediction?.winProbability ?? 60)
            : (team2Prediction?.winProbability ?? 60)
        )
      : null

  const seedStat = seed1 && seed2 ? getSeedMatchupStat(seed1, seed2) : null

  return NextResponse.json({
    team1Prediction: team1Prediction ?? null,
    team2Prediction: team2Prediction ?? null,
    odds,
    seedStat,
  })
}
