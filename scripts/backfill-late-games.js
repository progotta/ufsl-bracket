/**
 * Backfill script: fetch ESPN results for a given date and update any
 * incomplete games in the prod DB.
 *
 * Usage: node scripts/backfill-late-games.js [YYYYMMDD]
 * Defaults to yesterday if no date given.
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://szosapevsgegcgdifqhb.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b3NhcGV2c2dlZ2NnZGlmcWhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIwNTY0NiwiZXhwIjoyMDg4NzgxNjQ2fQ.OW2n3hHFVrOlhLbyicJYxVR5GsRdOwZZsSsTNo8tfGo'

const db = createClient(SUPABASE_URL, SERVICE_KEY)

// Round points mapping (must match ROUND_POINTS in lib/bracket.ts)
const ROUND_POINTS = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16, 6: 32 }

// getPickSlug mirrors the server-side logic in lib/bracketUtils.ts exactly.
// Uses global game_number minus round offset (NOT per-region local numbering).
const ROUND_OFFSETS = { 1: 0, 2: 32, 3: 48, 4: 56, 5: 60, 6: 0 }

function getPickSlug(game) {
  if (game.round === 6) return 'championship-r6-g1'
  const adjusted = game.game_number - (ROUND_OFFSETS[game.round] || 0)
  if (game.round === 5) return `ff-r5-g${adjusted}`
  return `${(game.region || '').toLowerCase()}-r${game.round}-g${adjusted}`
}

async function main() {
  const dateArg = process.argv[2]
  let dateStr
  if (dateArg) {
    dateStr = dateArg
  } else {
    // default to yesterday
    const d = new Date()
    d.setDate(d.getDate() - 1)
    dateStr = d.toISOString().slice(0, 10).replace(/-/g, '')
  }

  console.log(`\n🔍 Fetching ESPN scoreboard for date: ${dateStr}`)
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?groups=50&limit=64&dates=${dateStr}`
  const res = await fetch(url)
  if (!res.ok) {
    console.error('ESPN fetch failed:', res.status)
    process.exit(1)
  }
  const data = await res.json()
  const events = data?.events ?? []
  console.log(`📡 ESPN returned ${events.length} events`)

  // Load teams by espn_id
  const { data: allTeams } = await db.from('teams').select('id, espn_id, name')
  const teamByEspnId = {}
  for (const t of allTeams ?? []) {
    if (t.espn_id) teamByEspnId[String(t.espn_id)] = t
  }

  // Load incomplete games
  const { data: incompleteGames, error: gErr } = await db
    .from('games')
    .select('*')
    .neq('status', 'completed')
    .eq('season', 2026)

  if (gErr) { console.error('DB error:', gErr); process.exit(1) }
  console.log(`📋 ${incompleteGames?.length ?? 0} incomplete games in DB`)

  if (!incompleteGames?.length) {
    console.log('✅ No incomplete games — nothing to do.')
    return
  }

  let updated = 0
  const errors = []

  for (const event of events) {
    const statusName = event?.status?.type?.name
    if (statusName !== 'STATUS_FINAL') continue

    const competitors = event?.competitions?.[0]?.competitors ?? []
    if (competitors.length !== 2) continue

    const espnWinner = competitors.find(c => c.winner === true)
    const espnLoser = competitors.find(c => c.winner !== true)
    if (!espnWinner || !espnLoser) continue

    const winnerEspnId = String(espnWinner.team.id)
    const loserEspnId = String(espnLoser.team.id)
    const winnerTeam = teamByEspnId[winnerEspnId]
    const loserTeam = teamByEspnId[loserEspnId]
    if (!winnerTeam || !loserTeam) continue

    const game = incompleteGames.find(g =>
      (g.team1_id === winnerTeam.id && g.team2_id === loserTeam.id) ||
      (g.team1_id === loserTeam.id && g.team2_id === winnerTeam.id)
    )
    if (!game) continue

    const winnerScore = parseInt(espnWinner.score) || null
    const loserScore = parseInt(espnLoser.score) || null
    const team1IsWinner = game.team1_id === winnerTeam.id

    console.log(`\n🏀 ${winnerTeam.name} def. ${loserTeam.name} ${winnerScore}-${loserScore}`)
    console.log(`   DB game: ${getPickSlug(game)} (id: ${game.id})`)

    const { error: updateError } = await db
      .from('games')
      .update({
        status: 'completed',
        winner_id: winnerTeam.id,
        team1_score: team1IsWinner ? winnerScore : loserScore,
        team2_score: team1IsWinner ? loserScore : winnerScore,
        completed_at: new Date().toISOString(),
      })
      .eq('id', game.id)

    if (updateError) {
      console.error(`   ❌ Update error: ${updateError.message}`)
      errors.push(updateError.message)
      continue
    }

    const gameSlug = getPickSlug(game)
    const roundPoints = ROUND_POINTS[game.round] || 1

    const { error: rpcError } = await db.rpc('recalculate_scores_for_game', {
      p_game_id: gameSlug,
      p_winner_id: winnerTeam.id,
      p_round_points: roundPoints,
    })
    if (rpcError) {
      console.error(`   ❌ Score recalc error: ${rpcError.message}`)
      errors.push(`RPC scores ${gameSlug}: ${rpcError.message}`)
    }

    const { error: maxError } = await db.rpc('recalculate_max_possible_for_game', {
      p_loser_id: loserTeam.id,
    })
    if (maxError) {
      console.error(`   ❌ Max possible error: ${maxError.message}`)
      errors.push(`RPC max: ${maxError.message}`)
    }

    console.log(`   ✅ Updated and recalculated scores`)
    updated++
  }

  console.log(`\n🎯 Done. ${updated} games updated.`)
  if (errors.length) {
    console.log(`⚠️  Errors (${errors.length}):`, errors)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
