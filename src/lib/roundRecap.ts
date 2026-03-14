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
        biggestUpset = `Biggest upset: ${winners[0].seed}-seed ${winners[0].name}`
      }
    }
  }

  const roundName = ROUND_NAMES[round] || `Round ${round}`
  const leaderLine = top3?.length
    ? top3.map((e, i) => `${['🥇', '🥈', '🥉'][i]} ${e.display_name} (${e.score}pts)`).join(' ')
    : ''

  const parts = [leaderLine, biggestUpset].filter(Boolean)
  const recap = parts.join(' | ') || 'Check the leaderboard for standings!'

  await notifyPoolMembers(poolId, {
    type: 'round_complete',
    title: `🏀 ${roundName} complete!`,
    message: recap,
    action_url: `/pools/${poolId}`,
  })
}
