import { createClient } from '@/lib/supabase/client'

let cache: { enabled: boolean; date: Date } | null = null
let cacheExpiry = 0

export async function getCurrentTime(): Promise<Date> {
  if (typeof window === 'undefined') return new Date()
  const now = Date.now()
  if (cache && now < cacheExpiry) {
    return cache.enabled && cache.date ? cache.date : new Date()
  }
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('simulation_config')
      .select('is_simulation_mode,current_simulated_date')
      .single()
    cache = {
      enabled: data?.is_simulation_mode ?? false,
      date: data?.current_simulated_date ? new Date(data.current_simulated_date) : new Date(),
    }
    cacheExpiry = now + 5000
    return cache.enabled ? cache.date : new Date()
  } catch {
    return new Date()
  }
}
