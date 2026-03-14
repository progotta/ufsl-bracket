import { createClient } from '@supabase/supabase-js'
import { notifyPoolMembers } from './notify'

const ROUND_NAMES: Record<number, string> = {
  1: 'Round of 64',
  2: 'Round of 32',
  3: 'Sweet 16',
  4: 'Elite 8',
  5: 'Final Four',
  6: 'Championship',
}

export async function sendRoundRecap(poolId: string, round: number) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get top 3 from leaderboard
  const { data: top3 } = await supabase
    .from('leaderboard')
    .select('display_name, score, rank')
    .eq('pool_id', poolId)
    .order('rank', { ascending: true })
    .limit(3)

  // Get biggest upset: lowest seed that won this round
  const { data: roundGames } = await supabase
    .from('games')
    .select('winner_id, team1_id, team2_id')
    .eq('round', round)
    .not('winner_id', 'is', null)

  let biggestUpset = ''
  if (roundGames && roundGames.length > 0) {
    const winnerIds = roundGames.map(g => g.winner_id!).filter(Boolean)
    if (winnerIds.length > 0) {
      const { data: winners } = await supabase
        .from('teams')
        .select('name, seed')
        .in('id', winnerIds)
        .order('seed', { ascending: false })
        .limit(1)

      if (winners && winners.length > 0 && winners[0].seed && winners[0].seed > 8) {
        biggestUpset = `#${winners[0].seed} ${winners[0].name}`
      }
    }
  }

  // Count eliminated brackets (max_possible_score < 4th place score)
  let eliminatedCount = 0
  const { data: allBrackets } = await supabase
    .from('brackets')
    .select('score, max_possible_score')
    .eq('pool_id', poolId)
    .order('score', { ascending: false })

  if (allBrackets && allBrackets.length > 3) {
    const fourthPlaceScore = allBrackets[3]?.score || 0
    eliminatedCount = allBrackets.filter(
      b => b.max_possible_score !== null && b.max_possible_score < fourthPlaceScore
    ).length
  }

  const roundName = ROUND_NAMES[round] || `Round ${round}`

  // Build message
  const parts: string[] = []

  if (top3?.length) {
    const standings = top3
      .map((e, i) => `${['🥇', '🥈', '🥉'][i]} ${e.display_name} (${e.score}pts)`)
      .join(' ')
    parts.push(`📊 Standings: ${standings}`)
  }

  if (biggestUpset) {
    parts.push(`😱 Biggest upset: ${biggestUpset}`)
  }

  if (eliminatedCount > 0) {
    parts.push(`💀 ${eliminatedCount} bracket${eliminatedCount === 1 ? '' : 's'} already eliminated`)
  }

  const recap = parts.join('\n') || 'Check the leaderboard for standings!'

  await notifyPoolMembers(poolId, {
    type: 'round_complete',
    title: `🏀 ${roundName} Complete!`,
    message: recap,
    action_url: `/pools/${poolId}`,
  })
}
