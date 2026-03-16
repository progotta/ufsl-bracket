'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeLeaderboard(poolId: string, initialData: any[]) {
  const [leaderboard, setLeaderboard] = useState(initialData)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`leaderboard-${poolId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'brackets',
        filter: `pool_id=eq.${poolId}`,
      }, () => {
        // Cancel any in-flight request before firing a new one (prevents stale last-write-wins)
        abortRef.current?.abort()
        abortRef.current = new AbortController()

        fetch(`/api/pools/${poolId}/leaderboard`, { signal: abortRef.current.signal })
          .then(r => {
            if (r.status === 403) {
              // Membership revoked — redirect to dashboard
              window.location.href = '/dashboard'
              return null
            }
            return r.json()
          })
          .then(data => { if (data?.leaderboard) setLeaderboard(data.leaderboard) })
          .catch(e => { if (e.name !== 'AbortError') console.error(e) })
      })
      .subscribe()

    return () => {
      abortRef.current?.abort()
      supabase.removeChannel(channel)
    }
  }, [poolId])

  return leaderboard
}
