'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export function useRealtimeLeaderboard(poolId: string, initialData: any[]) {
  const [leaderboard, setLeaderboard] = useState(initialData)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel(`leaderboard-${poolId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'brackets',
        filter: `pool_id=eq.${poolId}`,
      }, () => {
        // Refetch leaderboard from API when brackets change
        fetch(`/api/pools/${poolId}/leaderboard`)
          .then(r => r.json())
          .then(data => { if (data.leaderboard) setLeaderboard(data.leaderboard) })
          .catch(() => {})
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [poolId])

  return leaderboard
}
