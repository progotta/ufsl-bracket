'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeMembers(poolId: string, initialMembers: any[]) {
  const [members, setMembers] = useState(initialMembers)

  useEffect(() => {
    const supabase = createClient()

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
          .then(r => {
            if (r.status === 403) {
              // Membership revoked — redirect to dashboard
              window.location.href = '/dashboard'
              return null
            }
            return r.json()
          })
          .then(data => { if (data?.members) setMembers(data.members) })
          .catch(() => {})
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [poolId])

  return members
}
