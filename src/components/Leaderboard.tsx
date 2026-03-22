'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Trophy, Users, Globe, Search, TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown, ChevronRight, Share2 } from 'lucide-react'
import { formatCurrency, getConsolationPrize } from '@/lib/payouts'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import PlayerAvatar from '@/components/ui/PlayerAvatar'
import LivePicksRow from '@/components/LivePicksRow'
import type { Team, Game } from '@/types/database'

// Lazy-load the share modal — only needed when the user clicks share
const ShareModal = dynamic(() => import('@/components/ShareModal'), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  user_id: string
  display_name: string | null
  avatar_url: string | null
  avatar_icon?: string | null
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
  round_picks?: number[] | null // [r1_correct, r2_correct, ..., r6_correct]
  champion_name?: string
  champion_abbr?: string
  champion_alive?: boolean
  picks?: Record<string, string>
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
                avatarIcon={entry.avatar_icon}
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
              {entry.champion_name && (
                <div className="text-[10px] text-brand-muted mt-0.5">
                  🏆 <span className={entry.champion_alive === false ? "line-through opacity-40" : ""}>{entry.champion_abbr || entry.champion_name}</span>
                </div>
              )}
              {(() => {
                const payout = payouts?.find(p => p.place === entry.rank)
                if (score === 0) return null
                if (payout) return <div className="text-xs font-bold text-green-400 mt-0.5">{formatCurrency(payout.amount)}</div>
                if (payouts && payouts.length > 0 && entry.rank > 1) {
                  return <div className="text-[10px] text-brand-muted/70 italic mt-0.5">{getConsolationPrize(entry.rank)}</div>
                }
                return null
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

// ─── Round Grid (inline for leaderboard rows) ────────────────────────────────

const ROUND_HEADERS = ['R64', 'R32', 'S16', 'E8', 'F4', '🏆']
const ROUND_TOTALS = [32, 16, 8, 4, 2, 1]

function LeaderboardRoundGrid({ roundPicks, currentRound }: {
  roundPicks: number[] | null | undefined
  currentRound: number
}) {
  // roundPicks: array of 6 correct-pick counts, or null if no games played yet
  // currentRound: 1-indexed round currently in play (1=R64, 2=R32, etc.)
  return (
    <div className="grid grid-cols-6 border border-brand-border/60 rounded-lg overflow-hidden mt-2">
      {ROUND_HEADERS.map((header, i) => {
        const round = i + 1 // 1-indexed
        const correct = roundPicks?.[i] ?? null
        const total = ROUND_TOTALS[i]
        const ratio = correct !== null ? correct / total : null
        const hasData = correct !== null
        const isActive = round === currentRound
        const isPast = round < currentRound

        const headerColor = isActive
          ? 'text-green-400 font-bold'
          : isPast
            ? 'text-green-600/60'
            : 'text-brand-muted/40'

        const scoreColor = isActive
          ? (!hasData ? 'text-brand-muted/40' :
              ratio! >= 0.75 ? 'text-green-400' :
              ratio! >= 0.5 ? 'text-yellow-400' :
              'text-red-400')
          : isPast
            ? (!hasData ? 'text-brand-muted/30' :
                ratio! >= 0.75 ? 'text-green-600/60' :
                ratio! >= 0.5 ? 'text-yellow-600/60' :
                'text-red-600/60')
            : 'text-brand-muted/25'

        const bgColor = isActive
          ? 'bg-green-500/10'
          : ''

        const borderTop = isActive ? 'border-t-2 border-green-400' : 'border-t-2 border-transparent'

        return (
          <div
            key={i}
            className={`flex flex-col items-center py-1.5 ${bgColor} ${borderTop} ${i > 0 ? 'border-l border-brand-border/60' : ''}`}
          >
            <span className={`text-[9px] uppercase tracking-wide leading-none mb-1 ${headerColor}`}>
              {header}
            </span>
            <span className={`text-sm font-bold leading-none tabular-nums ${scoreColor}`}>
              {hasData ? correct : '—'}
            </span>
            <span className="text-[9px] text-brand-muted/40 leading-none mt-0.5 tabular-nums">
              {hasData ? `/${total}` : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Table Row ────────────────────────────────────────────────────────────────

const RANK_COLORS: Record<number, string> = {
  1: 'text-yellow-400 font-bold',
  2: 'text-slate-300 font-bold',
  3: 'text-amber-600 font-bold',
}

function TableRow({ entry, isMe, isGlobal, onClick, payouts, multiBracket, onePayoutPerPerson, picks, teams, games, currentRound }: {
  entry: LeaderboardEntry
  isMe: boolean
  isGlobal: boolean
  onClick: () => void
  payouts?: PayoutInfo[]
  multiBracket?: boolean
  onePayoutPerPerson?: boolean
  picks?: Record<string, string>
  teams: Team[]
  games: Game[]
  currentRound: number
}) {
  const score = isGlobal ? (entry.total_score ?? 0) : (entry.score ?? 0)
  const maxPossible = isGlobal ? (entry.best_score ?? 0) : (entry.max_possible_score ?? 0)
  const display = entry.display_name || 'Anonymous'
  const rankColor = RANK_COLORS[entry.rank] ?? 'text-brand-muted font-medium'
  const payout = payouts?.find(p => p.place === entry.rank)

  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2.5 border-t border-brand-border text-left cursor-pointer ${
        isMe ? 'bg-brand-orange/5 border-l-2 border-l-brand-orange hover:bg-brand-orange/10' : 'hover:bg-brand-card/50'
      } transition-colors group`}
    >
      {/* Row 1: Rank | Avatar | Name + bracket | movement | score */}
      <div className="flex items-center gap-2.5">
        {/* Rank */}
        <span className={`text-sm tabular-nums w-7 text-center shrink-0 ${rankColor}`}>
          #{entry.rank}
        </span>

        {/* Avatar */}
        <PlayerAvatar
          userId={entry.user_id}
          displayName={display}
          avatarUrl={entry.avatar_url}
          avatarIcon={entry.avatar_icon}
          size="w-7 h-7"
          borderClass={isMe ? 'border-brand-orange' : 'border-brand-border/40'}
        />

        {/* Name + bracket */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium truncate ${isMe ? 'text-brand-orange' : 'group-hover:text-white'}`}>
            {display}
            {isMe && <span className="text-xs ml-1 text-brand-muted font-normal">(you)</span>}
            {onePayoutPerPerson && !isGlobal && entry.is_best_bracket === false && (
              <span className="text-xs ml-1 text-brand-muted font-normal">(not eligible)</span>
            )}
          </div>
          {!isGlobal && (entry.bracket_name || multiBracket) && (
            <div className="text-[11px] text-brand-muted truncate">
              {entry.bracket_name || `Bracket ${entry.bracket_number || 1}`}
            </div>
          )}
          {!isGlobal && entry.champion_name && (
            <div className="text-[11px] text-brand-muted truncate">
              🏆 <span className={entry.champion_alive === false ? "line-through opacity-40" : ""}>
                {entry.champion_abbr || entry.champion_name}
              </span>
            </div>
          )}
          {isGlobal && (
            <div className="text-[11px] text-brand-muted">{entry.bracket_count} bracket{entry.bracket_count !== 1 ? 's' : ''}</div>
          )}
        </div>

        {/* Movement */}
        <MovementBadge movement={entry.movement} />

        {/* Score */}
        <div className="text-right shrink-0">
          <div className={`text-sm font-bold tabular-nums ${isMe ? 'text-brand-orange' : 'text-white'}`}>
            {score}
          </div>
          {!isGlobal && maxPossible > 0 && (
            <div className="text-[10px] text-brand-muted tabular-nums">/{maxPossible}</div>
          )}
          {score > 0 && payout && (
            <div className="text-[10px] font-bold text-green-400">💰 {formatCurrency(payout.amount)}</div>
          )}
          {score > 0 && !payout && payouts && payouts.length > 0 && entry.rank > 1 && (
            <div className="text-[10px] text-brand-muted/70 italic">{getConsolationPrize(entry.rank)}</div>
          )}
        </div>

        {/* Chevron */}
        <ChevronRight size={14} className="shrink-0 text-brand-muted/50 group-hover:text-brand-orange transition-colors" />
      </div>

      {/* Row 2: Live picks (pool tab only) */}
      {!isGlobal && picks && teams.length > 0 && (
        <LivePicksRow picks={picks} teams={teams} games={games} />
      )}
      {/* Row 3: Round grid (pool tab only) */}
      {!isGlobal && (
        <LeaderboardRoundGrid roundPicks={entry.round_picks} currentRound={currentRound} />
      )}
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
  const [teams, setTeams] = useState<Team[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [currentRound, setCurrentRound] = useState<number>(1)

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
      if (json.currentRound) setCurrentRound(json.currentRound)
    } catch (err) {
      console.error(err)
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [activeTab, poolId, globalFilter])

  useEffect(() => {
    fetchData().then(() => {
      if (activeTab === 'pool' && teams.length === 0) {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        supabase.from('teams').select('*').then(({ data }) => {
          setTeams(data ?? [])
        })
        supabase
          .from('games')
          .select('*')
          .eq('season', 2026)
          .then(({ data }) => { setGames(data ?? []) })
      }
    })
  }, [fetchData])

  // Realtime subscription: refresh pool leaderboard when brackets change
  useEffect(() => {
    if (!poolId || activeTab !== 'pool') return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel(`leaderboard-rt-${poolId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'brackets',
        filter: `pool_id=eq.${poolId}`,
      }, () => {
        fetchData()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [poolId, activeTab, fetchData])

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
  const rest = filtered

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
                picks={entry.picks}
                teams={teams}
                games={games}
                currentRound={currentRound}
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
                picks={entry.picks}
                teams={teams}
                games={games}
                currentRound={currentRound}
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
