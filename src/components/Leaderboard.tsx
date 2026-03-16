'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trophy, Users, Globe, Search, TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown, ChevronRight, Share2 } from 'lucide-react'
import { formatCurrency } from '@/lib/payouts'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import PlayerAvatar from '@/components/ui/PlayerAvatar'

// Lazy-load the share modal — only needed when the user clicks share
const ShareModal = dynamic(() => import('@/components/ShareModal'), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  user_id: string
  display_name: string | null
  avatar_url: string | null
  // Pool-specific
  bracket_id?: string
  bracket_name?: string
  bracket_number?: number
  score?: number
  correct_picks?: number
  max_possible_score?: number
  rank: number
  movement?: number | null
  is_best_bracket?: boolean
  // Global/Friends
  total_score?: number
  total_correct_picks?: number
  bracket_count?: number
  best_score?: number
  is_me?: boolean
}

type Tab = 'pool' | 'global' | 'friends'
type GlobalFilter = 'all-time' | 'this-round' | 'today'

interface PayoutInfo {
  place: number
  amount: number
  label: string
}

interface LeaderboardProps {
  poolId?: string
  currentUserId: string
  defaultTab?: Tab
  showTabs?: boolean
  entryFee?: number
  payouts?: PayoutInfo[]
  maxBracketsPerMember?: number
  onePayoutPerPerson?: boolean
}

// ─── Podium Component (top 3) ─────────────────────────────────────────────────

function Podium({ entries, currentUserId, onClickUser, payouts }: {
  entries: LeaderboardEntry[]
  currentUserId: string
  onClickUser: (userId: string, bracketId?: string) => void
  payouts?: PayoutInfo[]
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
              <PlayerAvatar
                userId={entry.user_id}
                displayName={display}
                avatarUrl={entry.avatar_url}
                size="w-14 h-14"
                borderClass={isMe ? 'border-brand-orange' : medal.border}
                className="shadow-lg"
              />
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
              {(() => {
                const payout = payouts?.find(p => p.place === entry.rank)
                if (!payout) return null
                return (
                  <div className="text-xs font-bold text-green-400 mt-0.5">
                    {formatCurrency(payout.amount)}
                  </div>
                )
              })()}
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

function TableRow({ entry, isMe, isGlobal, onClick, payouts, multiBracket, onePayoutPerPerson }: {
  entry: LeaderboardEntry
  isMe: boolean
  isGlobal: boolean
  onClick: () => void
  payouts?: PayoutInfo[]
  multiBracket?: boolean
  onePayoutPerPerson?: boolean
}) {
  const score = isGlobal ? (entry.total_score ?? 0) : (entry.score ?? 0)
  const correctPicks = isGlobal ? (entry.total_correct_picks ?? 0) : (entry.correct_picks ?? 0)
  const maxPossible = isGlobal ? (entry.best_score ?? 0) : (entry.max_possible_score ?? 0)
  const display = entry.display_name || 'Anonymous'

  return (
    <button
      onClick={onClick}
      className={`w-full grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 items-center px-4 py-3 border-t border-brand-border text-left cursor-pointer ${
        isMe ? 'bg-brand-orange/10 border-l-2 border-l-brand-orange hover:bg-brand-orange/15' : 'hover:bg-brand-card/50'
      } transition-colors group`}
    >
      {/* Rank */}
      <div className="w-7 text-center">
        <span className="text-brand-muted font-mono text-sm">#{entry.rank}</span>
      </div>

      {/* Player */}
      <div className="flex items-center gap-2.5 min-w-0">
        <PlayerAvatar
          userId={entry.user_id}
          displayName={display}
          avatarUrl={entry.avatar_url}
          size="w-8 h-8"
          borderClass={isMe ? 'border-brand-orange' : 'border-brand-border/40'}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-semibold text-sm truncate ${isMe ? 'text-brand-orange' : 'group-hover:text-white'}`}>
              {display}
              {isMe && <span className="text-xs ml-1 text-brand-muted">(you)</span>}
            </span>
            {multiBracket && !isGlobal && (
              <span className="text-xs text-brand-muted bg-brand-surface px-2 py-0.5 rounded-full flex-shrink-0">
                {entry.bracket_name || `Bracket ${entry.bracket_number || 1}`}
              </span>
            )}
            {onePayoutPerPerson && !isGlobal && entry.is_best_bracket === false && (
              <span className="text-xs text-brand-muted flex-shrink-0">(not eligible)</span>
            )}
          </div>
          {!multiBracket && !isGlobal && entry.bracket_name && (
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
        {!isGlobal && maxPossible > 0 && (
          <div className="text-[10px] text-brand-muted">max {maxPossible}</div>
        )}
        {(() => {
          const payout = payouts?.find(p => p.place === entry.rank)
          if (!payout) return null
          return <div className="text-[10px] font-bold text-green-400">💰 {formatCurrency(payout.amount)}</div>
        })()}
      </div>

      {/* Chevron — view bracket */}
      <div className="flex-shrink-0 text-brand-muted group-hover:text-brand-orange transition-colors">
        <ChevronRight size={14} />
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
  entryFee = 0,
  payouts: payoutsProp,
  maxBracketsPerMember = 1,
  onePayoutPerPerson = false,
}: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab)
  const [globalFilter, setGlobalFilter] = useState<GlobalFilter>('all-time')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [shareTarget, setShareTarget] = useState<LeaderboardEntry | null>(null)

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
              <Podium entries={top3} currentUserId={currentUserId} onClickUser={handleClickUser} payouts={activeTab === 'pool' ? payoutsProp : undefined} />
            </div>
          )}

          {/* Table header */}
          {rest.length > 0 && (
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 px-4 py-2 border-t border-brand-border bg-brand-card/20">
              <span className="w-7 text-xs font-semibold text-brand-muted uppercase tracking-wide">#</span>
              <span className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Player</span>
              <span className="w-8 text-xs font-semibold text-brand-muted uppercase tracking-wide text-center">±</span>
              <span className="text-xs font-semibold text-brand-muted uppercase tracking-wide text-right hidden sm:block">✓ Picks</span>
              <span className="text-xs font-semibold text-brand-muted uppercase tracking-wide text-right">Score</span>
              <span className="w-[14px]" />
            </div>
          )}

          {/* If search is active, show all filtered entries in table */}
          {search ? (
            filtered.map(entry => (
              <TableRow
                key={entry.bracket_id || entry.user_id}
                entry={entry}
                isMe={entry.user_id === currentUserId}
                isGlobal={isGlobal}
                onClick={() => handleClickUser(entry.user_id, entry.bracket_id)}
                payouts={activeTab === 'pool' ? payoutsProp : undefined}
                multiBracket={maxBracketsPerMember > 1}
                onePayoutPerPerson={onePayoutPerPerson}
              />
            ))
          ) : (
            rest.map(entry => (
              <TableRow
                key={entry.bracket_id || entry.user_id}
                entry={entry}
                isMe={entry.user_id === currentUserId}
                isGlobal={isGlobal}
                onClick={() => handleClickUser(entry.user_id, entry.bracket_id)}
                payouts={activeTab === 'pool' ? payoutsProp : undefined}
                multiBracket={maxBracketsPerMember > 1}
                onePayoutPerPerson={onePayoutPerPerson}
              />
            ))
          )}

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-brand-border bg-brand-card/20 flex items-center justify-between">
              <span className="text-xs text-brand-muted">{filtered.length} player{filtered.length !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-3">
                {/* Share my rank button — only if current user is in leaderboard */}
                {(() => {
                  const myEntry = filtered.find(e => e.user_id === currentUserId)
                  if (!myEntry) return null
                  return (
                    <button
                      onClick={() => setShareTarget(myEntry)}
                      className="text-xs text-brand-orange hover:underline flex items-center gap-1"
                    >
                      <Share2 size={12} />
                      Share my rank
                    </button>
                  )
                })()}
                {activeTab === 'pool' && (
                  <Link href="/leaderboard" className="text-xs text-brand-orange hover:underline">
                    View Global Rankings →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Start your own pool CTA */}
          {filtered.length > 0 && (
            <div className="text-center py-4 border-t border-brand-border">
              <p className="text-xs text-brand-muted">
                Run your own pool next year? <a href="/" className="text-brand-orange hover:underline">UFSL handles everything →</a>
              </p>
            </div>
          )}
        </>
      )}

      {/* Share Modal */}
      {shareTarget && (
        <ShareModal
          isOpen={!!shareTarget}
          onClose={() => setShareTarget(null)}
          bracketId={shareTarget.bracket_id || ''}
          userName={shareTarget.display_name || 'Anonymous'}
          poolName="UFSL Pool"
          score={shareTarget.score ?? shareTarget.total_score ?? 0}
          rank={shareTarget.rank}
          poolStatus="active"
        />
      )}
    </div>
  )
}
