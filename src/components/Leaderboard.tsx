'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trophy, Users, Globe, Search, TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown, Share2 } from 'lucide-react'
import Link from 'next/link'
import ShareModal from '@/components/ShareModal'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  user_id: string
  display_name: string | null
  avatar_url: string | null
  // Pool-specific
  bracket_id?: string
  bracket_name?: string
  score?: number
  correct_picks?: number
  max_possible_score?: number
  rank: number
  movement?: number | null
  // Global/Friends
  total_score?: number
  total_correct_picks?: number
  bracket_count?: number
  best_score?: number
  is_me?: boolean
}

type Tab = 'pool' | 'global' | 'friends'
type GlobalFilter = 'all-time' | 'this-round' | 'today'

interface LeaderboardProps {
  poolId?: string
  currentUserId: string
  defaultTab?: Tab
  showTabs?: boolean
}

// ─── Podium Component (top 3) ─────────────────────────────────────────────────

function Podium({ entries, currentUserId, onClickUser }: {
  entries: LeaderboardEntry[]
  currentUserId: string
  onClickUser: (userId: string, bracketId?: string) => void
}) {
  const podiumOrder = [
    entries[1], // silver (2nd)
    entries[0], // gold (1st)
    entries[2], // bronze (3rd)
  ].filter(Boolean)

  const medals = [
    { color: 'from-slate-400 to-slate-300', textColor: 'text-slate-200', border: 'border-slate-400/40', height: 'h-24', label: '2nd', emoji: '🥈' },
    { color: 'from-brand-gold to-yellow-400', textColor: 'text-yellow-900', border: 'border-yellow-400/60', height: 'h-32', label: '1st', emoji: '🥇' },
    { color: 'from-amber-700 to-amber-600', textColor: 'text-amber-100', border: 'border-amber-600/40', height: 'h-20', label: '3rd', emoji: '🥉' },
  ]

  if (entries.length < 2) return null

  return (
    <div className="flex items-end justify-center gap-3 mb-8 px-4">
      {podiumOrder.map((entry, i) => {
        const medal = medals[i]
        const isMe = entry.user_id === currentUserId
        const score = entry.total_score ?? entry.score ?? 0
        const display = entry.display_name || 'Player'

        return (
          <button
            key={entry.user_id}
            onClick={() => onClickUser(entry.user_id, entry.bracket_id)}
            className="flex-1 max-w-[140px] flex flex-col items-center gap-2 group"
          >
            {/* Avatar */}
            <div className={`relative ${i === 1 ? 'scale-110' : ''}`}>
              {entry.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entry.avatar_url}
                  alt={display}
                  className={`w-14 h-14 rounded-full border-2 ${isMe ? 'border-brand-orange' : medal.border} shadow-lg`}
                />
              ) : (
                <div className={`w-14 h-14 rounded-full border-2 ${isMe ? 'border-brand-orange bg-brand-orange/20' : `${medal.border} bg-brand-card`} flex items-center justify-center text-xl font-black shadow-lg`}>
                  {display[0].toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 text-base">{medal.emoji}</span>
            </div>

            {/* Name */}
            <div className="text-center">
              <div className={`text-xs font-bold truncate max-w-[100px] ${isMe ? 'text-brand-orange' : 'text-white'}`}>
                {display}
                {isMe && <span className="ml-1 text-brand-muted">(you)</span>}
              </div>
              <div className="text-lg font-black text-brand-orange">{score}</div>
              <div className="text-xs text-brand-muted">pts</div>
            </div>

            {/* Podium block */}
            <div className={`w-full ${medal.height} bg-gradient-to-t ${medal.color} rounded-t-lg flex items-center justify-center border ${medal.border} group-hover:brightness-110 transition-all`}>
              <span className={`text-sm font-black ${medal.textColor}`}>{medal.label}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─── Movement Indicator ───────────────────────────────────────────────────────

function MovementBadge({ movement }: { movement: number | null | undefined }) {
  if (movement === null || movement === undefined) return null
  if (movement > 0) return (
    <span className="flex items-center text-green-400 text-xs font-semibold">
      <ChevronUp size={12} />{movement}
    </span>
  )
  if (movement < 0) return (
    <span className="flex items-center text-red-400 text-xs font-semibold">
      <ChevronDown size={12} />{Math.abs(movement)}
    </span>
  )
  return <Minus size={12} className="text-brand-muted" />
}

// ─── Table Row ────────────────────────────────────────────────────────────────

function TableRow({ entry, isMe, isGlobal, onClick }: {
  entry: LeaderboardEntry
  isMe: boolean
  isGlobal: boolean
  onClick: () => void
}) {
  const score = isGlobal ? (entry.total_score ?? 0) : (entry.score ?? 0)
  const correctPicks = isGlobal ? (entry.total_correct_picks ?? 0) : (entry.correct_picks ?? 0)
  const maxPossible = isGlobal ? (entry.best_score ?? 0) : (entry.max_possible_score ?? 0)
  const display = entry.display_name || 'Anonymous'

  return (
    <button
      onClick={onClick}
      className={`w-full grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-center px-4 py-3 border-t border-brand-border text-left ${
        isMe ? 'bg-brand-orange/5 hover:bg-brand-orange/10' : 'hover:bg-brand-card/50'
      } transition-colors group`}
    >
      {/* Rank */}
      <div className="w-7 text-center">
        <span className="text-brand-muted font-mono text-sm">#{entry.rank}</span>
      </div>

      {/* Player */}
      <div className="flex items-center gap-2.5 min-w-0">
        {entry.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.avatar_url} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold text-xs flex-shrink-0">
            {display[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className={`font-semibold text-sm truncate ${isMe ? 'text-brand-orange' : 'group-hover:text-white'}`}>
            {display}
            {isMe && <span className="text-xs ml-1 text-brand-muted">(you)</span>}
          </div>
          {!isGlobal && entry.bracket_name && (
            <div className="text-xs text-brand-muted truncate">{entry.bracket_name}</div>
          )}
          {isGlobal && (
            <div className="text-xs text-brand-muted">{entry.bracket_count} bracket{entry.bracket_count !== 1 ? 's' : ''}</div>
          )}
        </div>
      </div>

      {/* Movement */}
      <div className="w-8 flex justify-center">
        <MovementBadge movement={entry.movement} />
      </div>

      {/* Correct picks */}
      <div className="text-right hidden sm:block">
        <div className="text-xs text-green-400 font-semibold">{correctPicks}</div>
        <div className="text-xs text-brand-muted">correct</div>
      </div>

      {/* Score */}
      <div className="text-right">
        <div className={`text-lg font-black ${isMe ? 'text-brand-orange' : 'text-white'}`}>{score}</div>
        {!isGlobal && (
          <div className="text-xs text-brand-muted">/{maxPossible}</div>
        )}
      </div>
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Leaderboard({
  poolId,
  currentUserId,
  defaultTab = 'pool',
  showTabs = true,
}: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab)
  const [globalFilter, setGlobalFilter] = useState<GlobalFilter>('all-time')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      let url = ''
      if (activeTab === 'pool' && poolId) {
        url = `/api/leaderboard/pool/${poolId}`
      } else if (activeTab === 'global') {
        url = `/api/leaderboard/global?filter=${globalFilter}`
      } else if (activeTab === 'friends') {
        url = `/api/leaderboard/friends`
      } else {
        setLoading(false)
        return
      }

      const res = await fetch(url)
      const json = await res.json()
      setEntries(json.data || [])
    } catch (err) {
      console.error(err)
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [activeTab, poolId, globalFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleClickUser = (userId: string, bracketId?: string) => {
    if (bracketId) {
      window.location.href = `/brackets/${bracketId}`
    }
  }

  const isGlobal = activeTab !== 'pool'
  const filtered = entries.filter(e => {
    if (!search) return true
    const name = (e.display_name || '').toLowerCase()
    return name.includes(search.toLowerCase())
  })

  const top3 = filtered.slice(0, 3)
  const rest = filtered.slice(3)

  const tabs: { key: Tab; label: string; icon: React.ReactNode; show: boolean }[] = [
    { key: 'pool', label: 'Pool', icon: <Users size={14} />, show: !!poolId },
    { key: 'global', label: 'Global', icon: <Globe size={14} />, show: true },
    { key: 'friends', label: 'Friends', icon: <TrendingUp size={14} />, show: true },
  ]

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-brand-gold" />
            <h2 className="text-lg font-bold">Leaderboard</h2>
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-brand-card border border-brand-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-brand-muted focus:outline-none focus:border-brand-orange/50 w-32"
            />
          </div>
        </div>

        {/* Tabs */}
        {showTabs && (
          <div className="flex gap-1 bg-brand-card rounded-xl p-1">
            {tabs.filter(t => t.show).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-brand-orange text-white shadow-sm'
                    : 'text-brand-muted hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Global filter */}
        {activeTab === 'global' && (
          <div className="flex gap-1 mt-3">
            {(['all-time', 'this-round', 'today'] as GlobalFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setGlobalFilter(f)}
                className={`text-xs px-3 py-1 rounded-full border transition-all ${
                  globalFilter === f
                    ? 'border-brand-orange text-brand-orange bg-brand-orange/10'
                    : 'border-brand-border text-brand-muted hover:border-brand-muted'
                }`}
              >
                {f === 'all-time' ? 'All Time' : f === 'this-round' ? 'This Round' : 'Today'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="px-5 py-10 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-brand-orange/30 border-t-brand-orange rounded-full mx-auto mb-3" />
          <p className="text-brand-muted text-sm">Loading rankings...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <Trophy size={36} className="text-brand-muted mx-auto mb-3" />
          <p className="text-brand-muted text-sm">
            {search ? 'No players match your search.' : activeTab === 'pool'
              ? 'No brackets submitted yet. Be the first!'
              : activeTab === 'friends'
              ? 'No friends found. Join a pool to compete with others!'
              : 'No entries yet.'}
          </p>
        </div>
      ) : (
        <>
          {/* Podium — top 3 */}
          {filtered.length >= 2 && !search && (
            <div className="border-t border-brand-border pt-6 pb-2 bg-brand-card/30">
              <Podium entries={top3} currentUserId={currentUserId} onClickUser={handleClickUser} />
            </div>
          )}

          {/* Table header */}
          {rest.length > 0 && (
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-4 py-2 border-t border-brand-border bg-brand-card/20">
              <span className="w-7 text-xs font-semibold text-brand-muted uppercase tracking-wide">#</span>
              <span className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Player</span>
              <span className="w-8 text-xs font-semibold text-brand-muted uppercase tracking-wide text-center">±</span>
              <span className="text-xs font-semibold text-brand-muted uppercase tracking-wide text-right hidden sm:block">✓ Picks</span>
              <span className="text-xs font-semibold text-brand-muted uppercase tracking-wide text-right">Score</span>
            </div>
          )}

          {/* If search is active, show all filtered entries in table */}
          {search ? (
            filtered.map(entry => (
              <TableRow
                key={entry.user_id}
                entry={entry}
                isMe={entry.user_id === currentUserId}
                isGlobal={isGlobal}
                onClick={() => handleClickUser(entry.user_id, entry.bracket_id)}
              />
            ))
          ) : (
            rest.map(entry => (
              <TableRow
                key={entry.user_id}
                entry={entry}
                isMe={entry.user_id === currentUserId}
                isGlobal={isGlobal}
                onClick={() => handleClickUser(entry.user_id, entry.bracket_id)}
              />
            ))
          )}

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-brand-border bg-brand-card/20 flex items-center justify-between">
              <span className="text-xs text-brand-muted">{filtered.length} player{filtered.length !== 1 ? 's' : ''}</span>
              {activeTab === 'pool' && (
                <Link href="/leaderboard" className="text-xs text-brand-orange hover:underline">
                  View Global Rankings →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
