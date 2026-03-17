'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export function useRealtimeGames(initialGames: any[]) {
  const [games, setGames] = useState(initialGames)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel('games-live')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
      }, (payload) => {
        setGames(prev => prev.map(g =>
          g.id === payload.new.id ? { ...g, ...payload.new } : g
        ))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return games
}
