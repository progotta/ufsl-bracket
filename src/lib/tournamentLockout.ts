import { SupabaseClient } from '@supabase/supabase-js'

export async function isTournamentLocked(supabase: SupabaseClient): Promise<boolean> {
  try {
    const { data: sim } = await supabase
      .from('simulation_config')
      .select('is_simulation_mode,current_simulated_date')
      .single()

    const now =
      sim?.is_simulation_mode && sim?.current_simulated_date
        ? new Date(sim.current_simulated_date)
        : new Date()

    const { data: firstGame } = await supabase
      .from('games')
      .select('scheduled_time')
      .eq('round', 1)
      .order('scheduled_time')
      .limit(1)
      .single()

    if (!firstGame?.scheduled_time) return false
    return now >= new Date(firstGame.scheduled_time)
  } catch {
    return false
  }
}
