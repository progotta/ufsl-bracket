/**
 * Score verification script.
 * Independently recomputes every bracket's score from picks + completed games,
 * then compares to the stored DB score. Flags any mismatches.
 */
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://szosapevsgegcgdifqhb.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b3NhcGV2c2dlZ2NnZGlmcWhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIwNTY0NiwiZXhwIjoyMDg4NzgxNjQ2fQ.OW2n3hHFVrOlhLbyicJYxVR5GsRdOwZZsSsTNo8tfGo'
const db = createClient(SUPABASE_URL, SERVICE_KEY)

const ROUND_POINTS = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16, 6: 32 }
const ROUND_OFFSETS = { 1: 0, 2: 32, 3: 48, 4: 56, 5: 60, 6: 0 }

function getPickSlug(game) {
  if (game.round === 6) return 'championship-r6-g1'
  const adjusted = game.game_number - (ROUND_OFFSETS[game.round] || 0)
  if (game.round === 5) return `ff-r5-g${adjusted}`
  return `${(game.region || '').toLowerCase()}-r${game.round}-g${adjusted}`
}

async function main() {
  // Load all completed games
  const { data: games, error: gErr } = await db
    .from('games')
    .select('*')
    .eq('season', 2026)
    .eq('status', 'completed')
    .not('winner_id', 'is', null)
  if (gErr) { console.error(gErr); process.exit(1) }

  // Build slug → { winner_id, points } map
  const gameMap = {}
  for (const g of games) {
    const slug = getPickSlug(g)
    gameMap[slug] = { winner_id: g.winner_id, points: ROUND_POINTS[g.round] || 1 }
  }
  console.log(`Loaded ${games.length} completed games\n`)

  // Load all submitted brackets with profile names
  const { data: brackets, error: bErr } = await db
    .from('brackets')
    .select('id, name, bracket_name, user_id, score, picks, pool_id')
    .eq('is_submitted', true)
  if (bErr) { console.error(bErr); process.exit(1) }

  // Load profiles
  const { data: profiles } = await db.from('profiles').select('id, display_name')
  const profileMap = {}
  for (const p of profiles || []) profileMap[p.id] = p.display_name

  // Load pool names
  const { data: pools } = await db.from('pools').select('id, name')
  const poolMap = {}
  for (const p of pools || []) poolMap[p.id] = p.name

  let allOk = true
  const results = []

  for (const bracket of brackets) {
    const picks = bracket.picks || {}
    let expected = 0
    const roundScores = {}

    for (const [slug, game] of Object.entries(gameMap)) {
      if (picks[slug] === game.winner_id) {
        expected += game.points
        roundScores[slug.match(/r(\d)/)?.[1]] = (roundScores[slug.match(/r(\d)/)?.[1]] || 0) + game.points
      }
    }

    const stored = bracket.score || 0
    const match = stored === expected
    if (!match) allOk = false

    results.push({
      bracket: bracket.bracket_name || bracket.name,
      player: profileMap[bracket.user_id] || bracket.user_id,
      pool: poolMap[bracket.pool_id] || bracket.pool_id,
      stored,
      expected,
      match,
    })
  }

  // Sort: mismatches first, then by expected score desc
  results.sort((a, b) => {
    if (a.match !== b.match) return a.match ? 1 : -1
    return b.expected - a.expected
  })

  console.log('═'.repeat(90))
  console.log(
    'BRACKET'.padEnd(28) +
    'PLAYER'.padEnd(26) +
    'POOL'.padEnd(20) +
    'STORED'.padStart(7) +
    'EXPECTED'.padStart(9) +
    '  STATUS'
  )
  console.log('═'.repeat(90))

  for (const r of results) {
    const status = r.match ? '✅' : `❌ OFF BY ${r.expected - r.stored}`
    console.log(
      r.bracket.slice(0, 27).padEnd(28) +
      r.player.slice(0, 25).padEnd(26) +
      r.pool.slice(0, 19).padEnd(20) +
      String(r.stored).padStart(7) +
      String(r.expected).padStart(9) +
      '  ' + status
    )
  }

  console.log('═'.repeat(90))
  const mismatches = results.filter(r => !r.match)
  if (allOk) {
    console.log(`\n✅ All ${results.length} brackets verified — scores are correct.`)
  } else {
    console.log(`\n❌ ${mismatches.length} mismatches found out of ${results.length} brackets.`)
    // Auto-fix
    console.log('\nAuto-fixing...')
    for (const r of mismatches) {
      const bracket = brackets.find(b => (b.bracket_name || b.name) === r.bracket && (profileMap[b.user_id] || b.user_id) === r.player)
      if (!bracket) continue
      const { error } = await db.from('brackets').update({ score: r.expected }).eq('id', bracket.id)
      if (error) console.error(`  ❌ Fix failed for ${r.bracket}: ${error.message}`)
      else console.log(`  ✅ Fixed ${r.bracket} (${r.player}): ${r.stored} → ${r.expected}`)
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
