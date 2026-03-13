import { createServerClient } from '@/lib/supabase/server'

const ROUND_LABELS: Record<number, string> = { 1: 'R1', 2: 'R2', 3: 'Sweet 16', 4: 'Elite 8', 5: 'Final Four', 6: 'Championship' }

export default async function AdminGames() {
  const supabase = createServerClient()
  const { data: games } = await supabase
    .from('games')
    .select(`
      id, round, scheduled_time, status, home_score, away_score,
      sim_status, sim_home_score, sim_away_score,
      home_team:teams!games_home_team_id_fkey(name, abbreviation, seed),
      away_team:teams!games_away_team_id_fkey(name, abbreviation, seed),
      winner:teams!games_winner_id_fkey(abbreviation)
    `)
    .order('scheduled_time')
    .limit(200)

  return (
    <div className="max-w-6xl space-y-4">
      <h1 className="text-2xl font-bold">Games ({games?.length ?? 0})</h1>
      <p className="text-brand-muted text-sm">Use the Simulator page to edit game results.</p>
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border text-brand-muted text-xs uppercase">
              <th className="text-left p-3">Round</th>
              <th className="text-left p-3">Matchup</th>
              <th className="text-left p-3">Scheduled</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Score</th>
              <th className="text-left p-3">Winner</th>
            </tr>
          </thead>
          <tbody>
            {games?.map((g) => {
              const hasSim = g.sim_status || g.sim_home_score != null
              const status = g.sim_status || g.status || 'Scheduled'
              const homeScore = g.sim_home_score ?? g.home_score
              const awayScore = g.sim_away_score ?? g.away_score
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const home = g.home_team as any
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const away = g.away_team as any
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const winner = g.winner as any
              return (
                <tr key={g.id} className={`border-b border-brand-border/50 hover:bg-white/3 ${hasSim ? 'bg-yellow-500/5' : ''}`}>
                  <td className="p-3">
                    <span className="text-xs bg-brand-card border border-brand-border px-1.5 py-0.5 rounded">
                      {ROUND_LABELS[g.round] || `R${g.round}`}
                    </span>
                    {hasSim && <span className="ml-1 text-xs text-yellow-400">SIM</span>}
                  </td>
                  <td className="p-3">
                    <span className="font-medium">({home?.seed}) {home?.abbreviation}</span>
                    <span className="text-brand-muted mx-1">vs</span>
                    <span className="font-medium">({away?.seed}) {away?.abbreviation}</span>
                  </td>
                  <td className="p-3 text-brand-muted">{g.scheduled_time ? new Date(g.scheduled_time).toLocaleDateString() : '—'}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status === 'Final' ? 'bg-green-500/20 text-green-400' : status === 'InProgress' ? 'bg-red-500/20 text-red-400' : 'bg-brand-border text-brand-muted'}`}>
                      {status}
                    </span>
                  </td>
                  <td className="p-3 font-mono">{homeScore != null ? `${homeScore}–${awayScore}` : '—'}</td>
                  <td className="p-3 font-medium">{winner?.abbreviation || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
