'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { LiveScoresResponse, LiveGameScore } from '@/lib/liveScores'

// Polling intervals
const ACTIVE_POLL_MS = 30_000  // 30 sec when games are live
const IDLE_POLL_MS = 5 * 60_000 // 5 min when no active games
const IDLE_AFTER_MS = 5 * 60_000 // consider user idle after 5 min of no interaction

interface UseLiveScoresOptions {
  /** Filter to specific ESPN or DB game IDs */
  gameIds?: string[]
  /** Override polling interval (ms) */
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

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const mountedRef = useRef(true)

  // Track user activity to reduce polling when idle
  useEffect(() => {
    if (disabled) return
    const updateActivity = () => { lastActivityRef.current = Date.now() }
    window.addEventListener('mousemove', updateActivity, { passive: true })
    window.addEventListener('keydown', updateActivity, { passive: true })
    window.addEventListener('touchstart', updateActivity, { passive: true })
    window.addEventListener('visibilitychange', updateActivity)
    return () => {
      window.removeEventListener('mousemove', updateActivity)
      window.removeEventListener('keydown', updateActivity)
      window.removeEventListener('touchstart', updateActivity)
      window.removeEventListener('visibilitychange', updateActivity)
    }
  }, [disabled])

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

  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!mountedRef.current || disabled) return

    // Check if user is idle
    const userIsIdle = Date.now() - lastActivityRef.current > IDLE_AFTER_MS

    // Check if there are active games
    const hasActive = data?.games.some(
      g => g.status === 'in_progress' || g.status === 'halftime'
    ) ?? false

    let interval: number
    if (userIsIdle) {
      interval = IDLE_POLL_MS // Don't burn requests when user is away
    } else if (hasActive) {
      interval = ACTIVE_POLL_MS
    } else {
      interval = IDLE_POLL_MS
    }

    timerRef.current = setTimeout(() => {
      fetchScores().then(scheduleNext)
    }, interval)
  }, [data, disabled, fetchScores])

  // Initial fetch + start polling
  useEffect(() => {
    if (disabled) return
    mountedRef.current = true

    fetchScores().then(scheduleNext)

    return () => {
      mountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [disabled]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-schedule when data changes
  useEffect(() => {
    if (!disabled && !loading) scheduleNext()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const refetch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setLoading(true)
    fetchScores().then(scheduleNext)
  }, [fetchScores, scheduleNext])

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
