'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, ChevronUp } from 'lucide-react'

const REACTIONS = ['🔥', '💀', '😂', '🗑️'] as const
const POLL_INTERVAL = 8000 // 8 second polling fallback

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
}

interface SmackTalkProps {
  poolId: string
  currentUserId: string
  currentUserName?: string | null
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
    return <img src={profile.avatar_url} alt={name} className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
  }
  const colors = ['bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-pink-500', 'bg-yellow-500']
  const color = colors[userId.charCodeAt(0) % colors.length]
  return (
    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${color} text-white font-bold text-sm`}>
      {name[0].toUpperCase()}
    </div>
  )
}

export default function SmackTalk({ poolId, currentUserId, currentUserName }: SmackTalkProps) {
  const [messages, setMessages] = useState<SmackMessage[]>([])
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const newestTsRef = useRef<string | null>(null)

  const scrollToBottom = useCallback((smooth = true) => {
    // Scroll within the feed container only — scrollIntoView() scrolls the whole page
    if (feedRef.current) {
      if (smooth) {
        feedRef.current.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' })
      } else {
        feedRef.current.scrollTop = feedRef.current.scrollHeight
      }
    }
  }, [])

  const fetchMessages = useCallback(async (opts?: { before?: string; append?: boolean }) => {
    const params = new URLSearchParams({ pool_id: poolId, limit: '30' })
    if (opts?.before) params.set('before', opts.before)
    const res = await fetch(`/api/smack?${params}`)
    if (!res.ok) return null
    return res.json() as Promise<{ messages: SmackMessage[]; hasMore: boolean }>
  }, [poolId])

  // Initial load
  useEffect(() => {
    setLoading(true)
    fetchMessages().then((data) => {
      if (data) {
        setMessages(data.messages)
        setHasMore(data.hasMore)
        if (data.messages.length > 0) {
          newestTsRef.current = data.messages[data.messages.length - 1].created_at
        }
      }
      setLoading(false)
      setTimeout(() => scrollToBottom(false), 50)
    })
  }, [poolId, fetchMessages, scrollToBottom])

  // Realtime subscription (Supabase) with polling fallback
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    const pollNew = async () => {
      if (!newestTsRef.current) return
      const params = new URLSearchParams({ pool_id: poolId, limit: '20' })
      const res = await fetch(`/api/smack?${params}`)
      if (!res.ok) return
      const data: { messages: SmackMessage[] } = await res.json()
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id))
        const newOnes = data.messages.filter(m => !existingIds.has(m.id))
        if (!newOnes.length) return prev
        newestTsRef.current = data.messages[data.messages.length - 1]?.created_at ?? newestTsRef.current
        setTimeout(() => scrollToBottom(), 50)
        return [...prev, ...newOnes]
      })
    }

    try {
      channel = supabase
        .channel(`smack:${poolId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'smack_messages', filter: `pool_id=eq.${poolId}` },
          async (payload) => {
            // Fetch the full message with profile join
            const res = await fetch(`/api/smack?pool_id=${poolId}&limit=5`)
            if (!res.ok) return
            const data: { messages: SmackMessage[] } = await res.json()
            setMessages(prev => {
              const existingIds = new Set(prev.map(m => m.id))
              const newOnes = data.messages.filter(m => !existingIds.has(m.id))
              if (!newOnes.length) return prev
              newestTsRef.current = data.messages[data.messages.length - 1]?.created_at ?? newestTsRef.current
              setTimeout(() => scrollToBottom(), 50)
              return [...prev, ...newOnes]
            })
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'smack_messages', filter: `pool_id=eq.${poolId}` },
          (payload) => {
            const updated = payload.new as SmackMessage
            setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, reactions: updated.reactions } : m))
          }
        )
        .subscribe((status) => {
          if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            // Fall back to polling
            pollingRef.current = setInterval(pollNew, POLL_INTERVAL)
          }
        })
    } catch {
      pollingRef.current = setInterval(pollNew, POLL_INTERVAL)
    }

    return () => {
      if (channel) supabase.removeChannel(channel)
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [poolId, supabase, scrollToBottom])

  const loadMore = async () => {
    if (!messages.length || loadingMore) return
    setLoadingMore(true)
    const oldest = messages[0].created_at
    const data = await fetchMessages({ before: oldest })
    if (data) {
      setMessages(prev => [...data.messages, ...prev])
      setHasMore(data.hasMore)
    }
    setLoadingMore(false)
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setError(null)
    const res = await fetch('/api/smack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pool_id: poolId, message: text }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Failed to send')
    } else {
      setInput('')
      const data = await res.json()
      setMessages(prev => {
        if (prev.find(m => m.id === data.message.id)) return prev
        return [...prev, data.message]
      })
      newestTsRef.current = data.message.created_at
      setTimeout(() => scrollToBottom(), 50)
    }
    setSending(false)
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

  const charsLeft = 280 - input.length
  const nearLimit = charsLeft <= 40
  const overLimit = charsLeft < 0

  return (
    <div className="flex flex-col h-[520px] bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-brand-border flex items-center gap-2">
        <span className="text-lg">💬</span>
        <h3 className="font-bold text-sm">Smack Talk</h3>
        <span className="text-xs text-brand-muted ml-auto">{messages.length} messages</span>
      </div>

      {/* Message feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin">
        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center pt-1">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-white transition-colors px-3 py-1.5 rounded-full border border-brand-border hover:border-brand-orange/50"
            >
              <ChevronUp size={14} />
              {loadingMore ? 'Loading…' : 'Load older messages'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32 text-brand-muted text-sm">Loading smack…</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-brand-muted text-center">
            <span className="text-3xl mb-2">🏀</span>
            <p className="text-sm font-medium">No smack yet.</p>
            <p className="text-xs mt-1">Be the first to talk trash.</p>
            <button
              onClick={() => inputRef.current?.focus()}
              className="mt-3 text-sm px-4 py-1.5 rounded-lg border border-brand-border bg-brand-card hover:border-brand-orange/50 text-white/80 hover:text-white transition-colors"
            >
              💬 Start the trash talk
            </button>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === currentUserId
            const profile = msg.profiles
            const name = profile?.display_name || (isMe ? currentUserName : null) || 'Anonymous'

            return (
              <div key={msg.id} className={`flex gap-3 group ${isMe ? 'flex-row-reverse' : ''}`}>
                <Avatar profile={profile} userId={msg.user_id} />
                <div className={`flex flex-col gap-1 max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-baseline gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs font-semibold text-brand-muted">{isMe ? 'You' : name}</span>
                    <span className="text-xs text-brand-muted/50">{timeAgo(msg.created_at)}</span>
                  </div>
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-brand-orange text-white rounded-tr-sm'
                        : 'bg-brand-card text-white rounded-tl-sm'
                    }`}
                  >
                    {msg.message}
                  </div>

                  {/* Reaction bar */}
                  <div className={`flex items-center gap-1 flex-wrap ${isMe ? 'justify-end' : ''}`}>
                    {/* Existing reactions */}
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
                    {/* Add reaction buttons — always visible on mobile, hover on desktop */}
                    <div className={`flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity`}>
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
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-brand-border px-4 py-3">
        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Talk your trash… (Enter to send)"
              rows={1}
              className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-brand-muted resize-none focus:outline-none focus:border-brand-orange/50 transition-colors pr-14"
              style={{ minHeight: '42px', maxHeight: '120px' }}
            />
            <span
              className={`absolute right-3 bottom-2.5 text-xs tabular-nums ${
                overLimit ? 'text-red-400 font-bold' : nearLimit ? 'text-yellow-400' : 'text-brand-muted/50'
              }`}
            >
              {charsLeft}
            </span>
          </div>
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim() || overLimit}
            className="bg-brand-orange hover:bg-brand-orange/80 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl p-2.5 transition-colors flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
