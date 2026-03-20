'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { LiveScoresResponse, LiveGameScore } from '@/lib/liveScores'

interface UseLiveScoresOptions {
  /** Filter to specific ESPN or DB game IDs */
  gameIds?: string[]
  /** Override polling interval (ms) — kept for API compat, ignored (Realtime used instead) */
  pollInterval?: number
  /** Called when scores change */
  onUpdate?: (games: LiveGameScore[]) => void
  /** Skip fetching entirely */
  disabled?: boolean
}

interface UseLiveScoresResult {
  games: LiveGameScore[]
  activeGames: LiveGameScore[]
  loading: boolean
  error: string | null
  source: LiveScoresResponse['source'] | null
  lastUpdated: Date | null
  hasActiveGames: boolean
  refetch: () => void
}

export function useLiveScores(options: UseLiveScoresOptions = {}): UseLiveScoresResult {
  const { gameIds, onUpdate, disabled = false } = options

  const [data, setData] = useState<LiveScoresResponse | null>(null)
  const [loading, setLoading] = useState(!disabled)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const mountedRef = useRef(true)

  const fetchScores = useCallback(async () => {
    if (!mountedRef.current || disabled) return

    try {
      const res = await fetch('/api/scores/live', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json: LiveScoresResponse = await res.json()
      if (!mountedRef.current) return

      setData(json)
      setError(null)
      setLastUpdated(new Date())

      if (onUpdate) onUpdate(json.games)
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch scores')
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [disabled, onUpdate])

  // Initial fetch
  useEffect(() => {
    if (disabled) return
    mountedRef.current = true
    fetchScores()
    return () => { mountedRef.current = false }
  }, [disabled, fetchScores])

  // Polling interval: 30s when games are live, 5 min when idle
  useEffect(() => {
    if (disabled) return

    const ACTIVE_INTERVAL = 30_000
    const IDLE_INTERVAL = 5 * 60_000

    let timerId: ReturnType<typeof setTimeout>

    const schedule = () => {
      const hasActive = (data?.games ?? []).some(
        g => g.status === 'in_progress' || g.status === 'halftime'
      )
      timerId = setTimeout(async () => {
        await fetchScores()
        schedule()
      }, hasActive ? ACTIVE_INTERVAL : IDLE_INTERVAL)
    }

    schedule()
    return () => clearTimeout(timerId)
  }, [disabled, fetchScores, data?.games])

  // Realtime subscription: refetch whenever games table updates (game completions)
  useEffect(() => {
    if (disabled) return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel('live-scores-rt')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
      }, () => {
        fetchScores()
      })
      .subscribe()

    // Also re-fetch when the tab becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchScores()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [disabled, fetchScores])

  const refetch = useCallback(() => {
    setLoading(true)
    fetchScores()
  }, [fetchScores])

  // Filter by game IDs if provided
  const allGames = data?.games ?? []
  const games = gameIds
    ? allGames.filter(g => gameIds.includes(g.id) || (g.espnId && gameIds.includes(g.espnId)))
    : allGames

  const activeGames = games.filter(
    g => g.status === 'in_progress' || g.status === 'halftime'
  )

  return {
    games,
    activeGames,
    loading,
    error,
    source: data?.source ?? null,
    lastUpdated,
    hasActiveGames: activeGames.length > 0,
    refetch,
  }
}

/**
 * Lightweight hook that returns just the score for a single game.
 * Useful for bracket cell inline score display.
 */
export function useGameScore(gameId: string | undefined) {
  const { games, loading } = useLiveScores({ disabled: !gameId })
  const game = gameId ? games.find(g => g.id === gameId || g.espnId === gameId) : undefined
  return { game, loading }
}
