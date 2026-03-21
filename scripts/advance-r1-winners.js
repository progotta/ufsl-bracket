const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://szosapevsgegcgdifqhb.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b3NhcGV2c2dlZ2NnZGlmcWhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIwNTY0NiwiZXhwIjoyMDg4NzgxNjQ2fQ.OW2n3hHFVrOlhLbyicJYxVR5GsRdOwZZsSsTNo8tfGo'
const db = createClient(SUPABASE_URL, SERVICE_KEY)

// From bracketAdvancement.ts
const BRACKET_ADVANCEMENT = {
  1:{nextGameNumber:33,slot:'team1_id'}, 2:{nextGameNumber:33,slot:'team2_id'},
  3:{nextGameNumber:34,slot:'team1_id'}, 4:{nextGameNumber:34,slot:'team2_id'},
  5:{nextGameNumber:35,slot:'team1_id'}, 6:{nextGameNumber:35,slot:'team2_id'},
  7:{nextGameNumber:36,slot:'team1_id'}, 8:{nextGameNumber:36,slot:'team2_id'},
  9:{nextGameNumber:37,slot:'team1_id'}, 10:{nextGameNumber:37,slot:'team2_id'},
  11:{nextGameNumber:38,slot:'team1_id'}, 12:{nextGameNumber:38,slot:'team2_id'},
  13:{nextGameNumber:39,slot:'team1_id'}, 14:{nextGameNumber:39,slot:'team2_id'},
  15:{nextGameNumber:40,slot:'team1_id'}, 16:{nextGameNumber:40,slot:'team2_id'},
  17:{nextGameNumber:41,slot:'team1_id'}, 18:{nextGameNumber:41,slot:'team2_id'},
  19:{nextGameNumber:42,slot:'team1_id'}, 20:{nextGameNumber:42,slot:'team2_id'},
  21:{nextGameNumber:43,slot:'team1_id'}, 22:{nextGameNumber:43,slot:'team2_id'},
  23:{nextGameNumber:44,slot:'team1_id'}, 24:{nextGameNumber:44,slot:'team2_id'},
  25:{nextGameNumber:45,slot:'team1_id'}, 26:{nextGameNumber:45,slot:'team2_id'},
  27:{nextGameNumber:46,slot:'team1_id'}, 28:{nextGameNumber:46,slot:'team2_id'},
  29:{nextGameNumber:47,slot:'team1_id'}, 30:{nextGameNumber:47,slot:'team2_id'},
  31:{nextGameNumber:48,slot:'team1_id'}, 32:{nextGameNumber:48,slot:'team2_id'},
}

async function main() {
  const { data: r1Games, error } = await db
    .from('games')
    .select('game_number, winner_id, team1_id, team2_id')
    .eq('season', 2026).eq('round', 1).eq('status', 'completed').not('winner_id', 'is', null)

  if (error) { console.error(error); process.exit(1) }
  console.log(`Found ${r1Games.length} completed R1 games`)

  for (const game of r1Games) {
    const adv = BRACKET_ADVANCEMENT[game.game_number]
    if (!adv) continue
    const { error: e } = await db.from('games')
      .update({ [adv.slot]: game.winner_id })
      .eq('game_number', adv.nextGameNumber)
      .eq('season', 2026)
    if (e) console.error(`  ❌ Game ${game.game_number} → R2 game ${adv.nextGameNumber}: ${e.message}`)
    else console.log(`  ✅ Game ${game.game_number} winner → R2 game ${adv.nextGameNumber} (${adv.slot})`)
  }

  // Verify R2 slots
  const { data: r2 } = await db.from('games').select('game_number, team1_id, team2_id').eq('season', 2026).eq('round', 2).order('game_number')
  const empty = r2.filter(g => !g.team1_id || !g.team2_id)
  console.log(`\nR2 games with missing teams: ${empty.length}`)
  if (empty.length) console.log(empty.map(g => `  Game ${g.game_number}: team1=${g.team1_id ? '✅' : '❌'} team2=${g.team2_id ? '✅' : '❌'}`).join('\n'))
}

main().catch(e => { console.error(e); process.exit(1) })
