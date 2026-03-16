'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export function useRealtimeMembers(poolId: string, initialMembers: any[]) {
  const [members, setMembers] = useState(initialMembers)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel(`members-${poolId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pool_members',
        filter: `pool_id=eq.${poolId}`,
      }, () => {
        // Refetch members when membership changes
        fetch(`/api/pools/${poolId}/members`)
          .then(r => r.json())
          .then(data => { if (data.members) setMembers(data.members) })
          .catch(() => {})
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [poolId])

  return members
}
