'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronUp } from 'lucide-react'

const REACTIONS = ['🔥', '💀', '😂', '🗑️'] as const

interface SmackProfile {
  display_name: string | null
  avatar_url: string | null
}

interface SmackMessage {
  id: string
  pool_id: string
  user_id: string
  message: string
  created_at: string
  reactions: Record<string, string[]>
  profiles: SmackProfile | null
  poolName?: string
}

interface AllSmackProps {
  poolIds: string[]
  poolNames: Record<string, string>
  currentUserId: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function Avatar({ profile, userId }: { profile: SmackProfile | null; userId: string }) {
  const name = profile?.display_name || '?'
  if (profile?.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={profile.avatar_url} alt={name} className="w-7 h-7 rounded-full flex-shrink-0 object-cover" />
  }
  const colors = ['bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-pink-500', 'bg-yellow-500']
  const color = colors[userId.charCodeAt(0) % colors.length]
  return (
    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${color} text-white font-bold text-xs`}>
      {name[0].toUpperCase()}
    </div>
  )
}

export default function AllSmack({ poolIds, poolNames, currentUserId }: AllSmackProps) {
  const [messages, setMessages] = useState<SmackMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const supabase = createClient()
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchAll = useCallback(async (before?: string) => {
    if (!poolIds.length) return { messages: [], hasMore: false }
    // Fetch from each pool and merge
    const results = await Promise.all(
      poolIds.map(async (id) => {
        const params = new URLSearchParams({ pool_id: id, limit: '10' })
        if (before) params.set('before', before)
        const res = await fetch(`/api/smack?${params}`)
        if (!res.ok) return { messages: [], hasMore: false }
        const data: { messages: SmackMessage[]; hasMore: boolean } = await res.json()
        return {
          messages: data.messages.map(m => ({ ...m, poolName: poolNames[id] })),
          hasMore: data.hasMore,
        }
      })
    )
    const all = results.flatMap(r => r.messages)
    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return {
      messages: all.slice(0, 30),
      hasMore: results.some(r => r.hasMore) || all.length > 30,
    }
  }, [poolIds, poolNames])

  useEffect(() => {
    setLoading(true)
    fetchAll().then(data => {
      setMessages(data.messages)
      setHasMore(data.hasMore)
      setLoading(false)
    })

    // Polling for new messages across all pools
    pollingRef.current = setInterval(async () => {
      const data = await fetchAll()
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id))
        const newOnes = data.messages.filter(m => !existingIds.has(m.id))
        if (!newOnes.length) return prev
        return [...newOnes, ...prev].slice(0, 100)
      })
    }, 10000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [fetchAll])

  const loadMore = async () => {
    if (!messages.length || loadingMore) return
    setLoadingMore(true)
    const oldest = messages[messages.length - 1]?.created_at
    const data = await fetchAll(oldest)
    setMessages(prev => {
      const existingIds = new Set(prev.map(m => m.id))
      const newOnes = data.messages.filter(m => !existingIds.has(m.id))
      return [...prev, ...newOnes]
    })
    setHasMore(data.hasMore)
    setLoadingMore(false)
  }

  const toggleReaction = async (messageId: string, emoji: string) => {
    const res = await fetch('/api/smack/react', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: messageId, emoji }),
    })
    if (res.ok) {
      const data = await res.json()
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: data.reactions } : m))
    }
  }

  if (!poolIds.length) return null

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">💬</span>
        <h2 className="text-xl font-bold">All Smack</h2>
        <span className="text-xs text-brand-muted bg-brand-card px-2 py-0.5 rounded-full border border-brand-border">
          Across all pools
        </span>
      </div>

      {loading ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 text-center text-brand-muted text-sm">
          Loading smack…
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-brand-surface border border-dashed border-brand-border rounded-2xl p-8 text-center">
          <span className="text-3xl">🤐</span>
          <p className="text-brand-muted text-sm mt-2">No smack talk yet across your pools.</p>
        </div>
      ) : (
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden divide-y divide-brand-border">
          {messages.map((msg) => {
            const isMe = msg.user_id === currentUserId
            const name = msg.profiles?.display_name || 'Anonymous'

            return (
              <div key={msg.id} className="flex gap-3 px-5 py-4 group hover:bg-brand-card/30 transition-colors">
                <Avatar profile={msg.profiles} userId={msg.user_id} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className={`text-xs font-semibold ${isMe ? 'text-brand-orange' : 'text-white/80'}`}>
                      {isMe ? 'You' : name}
                    </span>
                    {msg.poolName && (
                      <span className="text-xs text-brand-muted bg-brand-card px-1.5 py-0.5 rounded border border-brand-border">
                        {msg.poolName}
                      </span>
                    )}
                    <span className="text-xs text-brand-muted/50 ml-auto">{timeAgo(msg.created_at)}</span>
                  </div>
                  <p className="text-sm text-white/90 mt-1 leading-relaxed">{msg.message}</p>

                  {/* Reactions */}
                  <div className="flex items-center gap-1 flex-wrap mt-2">
                    {REACTIONS.filter(e => msg.reactions?.[e]?.length > 0).map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => toggleReaction(msg.id, emoji)}
                        className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all ${
                          msg.reactions[emoji]?.includes(currentUserId)
                            ? 'bg-brand-orange/20 border-brand-orange/40 text-white'
                            : 'bg-brand-card border-brand-border text-brand-muted hover:border-brand-orange/30'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span>{msg.reactions[emoji].length}</span>
                      </button>
                    ))}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {REACTIONS.filter(e => !msg.reactions?.[e]?.length).map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(msg.id, emoji)}
                          className="text-xs px-1.5 py-0.5 rounded-full border border-brand-border text-brand-muted hover:text-white hover:border-brand-orange/40 transition-all"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {hasMore && (
            <div className="flex justify-center px-5 py-3">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-white transition-colors"
              >
                <ChevronUp size={14} />
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
