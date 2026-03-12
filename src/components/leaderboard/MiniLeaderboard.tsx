'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trophy, ArrowRight } from 'lucide-react'
import type { LeaderboardEntry } from '@/components/Leaderboard'

interface MiniLeaderboardProps {
  poolId: string
  poolName: string
  currentUserId: string
  limit?: number
}

export default function MiniLeaderboard({
  poolId,
  poolName,
  currentUserId,
  limit = 5,
}: MiniLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/leaderboard/pool/${poolId}`)
        const json = await res.json()
        const data: LeaderboardEntry[] = json.data || []
        setEntries(data.slice(0, limit))
        const me = data.find(e => e.user_id === currentUserId)
        // Show me even if outside top N
        if (me && (me.rank as number) > limit) {
          setMyEntry(me)
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [poolId, currentUserId, limit])

  if (loading) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-brand-card rounded w-1/2 mb-3" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="w-6 h-4 bg-brand-card rounded" />
              <div className="w-8 h-8 bg-brand-card rounded-full" />
              <div className="flex-1 h-4 bg-brand-card rounded" />
              <div className="w-10 h-4 bg-brand-card rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (entries.length === 0) return null

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-brand-gold" />
          <span className="text-sm font-bold truncate">{poolName}</span>
        </div>
        <Link
          href={`/pools/${poolId}`}
          className="text-xs text-brand-orange hover:underline flex items-center gap-1"
        >
          Full <ArrowRight size={12} />
        </Link>
      </div>

      {/* Entries */}
      {entries.map((entry, idx) => {
        const isMe = entry.user_id === currentUserId
        const score = entry.score ?? 0
        const display = entry.display_name || 'Anonymous'
        const rankEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null

        return (
          <div
            key={entry.user_id}
            className={`flex items-center gap-3 px-4 py-2.5 ${idx > 0 ? 'border-t border-brand-border/50' : ''} ${isMe ? 'bg-brand-orange/5' : ''}`}
          >
            {/* Rank */}
            <div className="w-6 text-center flex-shrink-0">
              {rankEmoji ? (
                <span className="text-base">{rankEmoji}</span>
              ) : (
                <span className="text-brand-muted font-mono text-xs">#{entry.rank}</span>
              )}
            </div>

            {/* Avatar */}
            {entry.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={entry.avatar_url} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold text-xs flex-shrink-0">
                {display[0].toUpperCase()}
              </div>
            )}

            {/* Name */}
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium truncate ${isMe ? 'text-brand-orange' : ''}`}>
                {display}
                {isMe && <span className="text-xs ml-1 text-brand-muted">(you)</span>}
              </span>
            </div>

            {/* Score */}
            <div className={`text-sm font-black ${isMe ? 'text-brand-orange' : 'text-white'}`}>
              {score}
            </div>
          </div>
        )
      })}

      {/* My rank if outside top N */}
      {myEntry && (
        <>
          <div className="flex items-center gap-2 px-4 py-1 border-t border-brand-border/50">
            <div className="flex-1 border-t border-dashed border-brand-border/50" />
            <span className="text-xs text-brand-muted">you</span>
            <div className="flex-1 border-t border-dashed border-brand-border/50" />
          </div>
          <div className="flex items-center gap-3 px-4 py-2.5 bg-brand-orange/5 border-t border-brand-border/50">
            <div className="w-6 text-center flex-shrink-0">
              <span className="text-brand-muted font-mono text-xs">#{myEntry.rank}</span>
            </div>
            {myEntry.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={myEntry.avatar_url} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold text-xs flex-shrink-0">
                {(myEntry.display_name || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-brand-orange truncate">
                {myEntry.display_name || 'You'} <span className="text-brand-muted text-xs">(you)</span>
              </span>
            </div>
            <div className="text-sm font-black text-brand-orange">{myEntry.score ?? 0}</div>
          </div>
        </>
      )}
    </div>
  )
}
