import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trophy, ArrowRight, RefreshCw, Zap, Share2 } from 'lucide-react'
import PoolLeaderboardPreview from '@/components/pools/PoolLeaderboardPreview'
import type { Profile, Bracket, Pool, Game, Team } from '@/types/database'
import NewsFeed from '@/components/NewsFeed'
import AllSmack from '@/components/smack/AllSmack'
import RecentAchievements from '@/components/achievements/RecentAchievements'
import AchievementsPanel from '@/components/achievements/AchievementsPanel'
import NotificationPrompt from '@/components/NotificationPrompt'
import LiveGames from '@/components/LiveGames'
import BracketRoundBreakdown from '@/components/BracketRoundBreakdown'
import BracketCardIntelligence from '@/components/BracketCardIntelligence'
import { computeAllBracketIntelligence } from '@/lib/bracketIntelligence'
import {
  BRACKET_TYPE_META,
  BRACKET_TYPE_ORDER,
  isBracketTypeOpen,
  isBracketBusted,
  getOpenBracketTypes,
  type BracketType,
} from '@/lib/secondChance'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/auth')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle()

  const profile = profileRaw as Profile | null

  const { data: membershipsRaw } = await supabase
    .from('pool_members')
    .select('role, pool_id')
    .eq('user_id', session.user.id)

  // Fetch pools separately for each membership to avoid join type issues
  const poolIds = membershipsRaw?.map(m => m.pool_id) || []
  const { data: poolsRaw } = poolIds.length > 0
    ? await supabase.from('pools').select('*').in('id', poolIds).order('created_at', { ascending: false })
    : { data: [] }

  const pools = (poolsRaw || []) as Pool[]

  const poolMap = new Map(pools.map(p => [p.id, p]))
  const membershipsWithPools = (membershipsRaw || []).map(m => ({
    role: m.role,
    pool: poolMap.get(m.pool_id),
  })).filter(m => m.pool)

  const { data: bracketsRaw } = await supabase
    .from('brackets')
    .select('*')
    .eq('user_id', session.user.id)
    .order('updated_at', { ascending: false })

  const brackets = (bracketsRaw || []) as Bracket[]

  // Fetch pool names for brackets
  const bracketPoolIds = Array.from(new Set(brackets.map(b => b.pool_id)))
  const { data: bracketPoolsRaw } = bracketPoolIds.length > 0
    ? await supabase.from('pools').select('id, name').in('id', bracketPoolIds)
    : { data: [] }
  const bracketPoolMap = new Map((bracketPoolsRaw || []).map((p: any) => [p.id, p.name]))

  // Fetch games to determine second chance availability and bracket bust status
  const { data: gamesRaw } = await supabase
    .from('games')
    .select('id, round, status, team1_id, team2_id, winner_id, scheduled_at')
  const games = (gamesRaw || []) as Game[]

  // Fetch teams for intelligence display (abbreviations, etc.)
  const { data: teamsRaw } = await supabase
    .from('teams')
    .select('id, name, abbreviation, seed, region, primary_color, espn_id')
  const teams = (teamsRaw || []) as Team[]

  // Fetch pool member counts for each pool the user has brackets in
  const allBracketPoolIds = Array.from(new Set(brackets.map(b => b.pool_id)))
  const poolMemberCounts = new Map<string, number>()
  if (allBracketPoolIds.length > 0) {
    // Get counts per pool
    for (const pid of allBracketPoolIds) {
      const { count } = await supabase
        .from('pool_members')
        .select('*', { count: 'exact', head: true })
        .eq('pool_id', pid)
      poolMemberCounts.set(pid, count || 0)
    }
  }

  // Fetch all brackets in each pool (for rank + popularity calculations)
  const allPoolBrackets = new Map<string, Bracket[]>()
  if (allBracketPoolIds.length > 0) {
    const { data: poolBracketsRaw } = await supabase
      .from('brackets')
      .select('*')
      .in('pool_id', allBracketPoolIds)
      .eq('is_submitted', true)
    const poolBracketsAll = (poolBracketsRaw || []) as Bracket[]
    for (const b of poolBracketsAll) {
      if (!allPoolBrackets.has(b.pool_id)) allPoolBrackets.set(b.pool_id, [])
      allPoolBrackets.get(b.pool_id)!.push(b)
    }
  }

  // Compute intelligence for all user brackets
  const bracketIntelligence = computeAllBracketIntelligence(
    brackets,
    allPoolBrackets,
    games,
    teams,
    poolMemberCounts,
  )

  const openBracketTypes = getOpenBracketTypes(games)
  const hasSecondChanceOpen = openBracketTypes.some(t => t !== 'full')

  // Check if the user's full bracket is busted
  const fullBrackets = brackets.filter(b => !b.bracket_type || b.bracket_type === 'full')
  const isFullBracketBusted = fullBrackets.length > 0 && fullBrackets.every(b => {
    const picks = (b.picks || {}) as Record<string, string>
    return isBracketBusted(picks, games)
  })

  const displayName = profile?.display_name || session.user.email?.split('@')[0] || 'Champion'

  // Collect all team IDs the user has picked across all brackets (for live score color coding)
  const userPickIds = Array.from(new Set(
    brackets.flatMap(b => Object.values((b.picks || {}) as Record<string, string>))
  ))

  // Group brackets by type
  const bracketsByType: Partial<Record<BracketType, Bracket[]>> = {}
  for (const bracket of brackets) {
    const type = (bracket.bracket_type || 'full') as BracketType
    if (!bracketsByType[type]) bracketsByType[type] = []
    bracketsByType[type]!.push(bracket)
  }

  // Tournament started = any game is completed or in_progress
  const tournamentStarted = games.some(g => g.status === 'completed' || g.status === 'in_progress')

  // Build pool leaderboard previews from allPoolBrackets
  // Map poolId -> { entries: top3, currentUserRank, currentUserScore }
  type PoolLbEntry = { userId: string; displayName: string; score: number; rank: number }
  const poolLeaderboards = new Map<string, {
    entries: PoolLbEntry[]
    currentUserRank?: number
    currentUserScore?: number
    totalMembers: number
  }>()
  for (const [poolId, poolBrackets] of Array.from(allPoolBrackets.entries())) {
    const sorted = [...poolBrackets].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    const entries: PoolLbEntry[] = sorted.slice(0, 3).map((b, i) => ({
      userId: b.user_id,
      displayName: b.name?.replace(/\'s bracket$/i, '').replace(/\'s 2025$/i, '') || 'Player',
      score: b.score ?? 0,
      rank: i + 1,
    }))
    const userRank = sorted.findIndex(b => b.user_id === session.user.id)
    const userBracket = sorted[userRank]
    poolLeaderboards.set(poolId, {
      entries,
      currentUserRank: userRank >= 0 ? userRank + 1 : undefined,
      currentUserScore: userBracket?.score ?? 0,
      totalMembers: poolMemberCounts.get(poolId) ?? sorted.length,
    })
  }

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">
            Hey, <span className="bg-brand-gradient bg-clip-text text-transparent">{displayName}</span> 👋
          </h1>
          <p className="text-brand-muted mt-1">
            2026 NCAA Tournament • March 19 – April 6
          </p>
        </div>
        <Link href="/pools/new" className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus size={18} />
          Create Pool
        </Link>
      </div>

      {/* ── PRIORITY 1: Brackets ── */}
      <section id="brackets">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Your Brackets</h2>
          {brackets.length > 0 && (
            <Link href="/pools" className="text-brand-orange text-sm hover:underline flex items-center gap-1">
              All pools <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {brackets.length === 0 ? (
          <EmptyState
            title="No brackets yet"
            desc="Join or create a pool to start making your picks."
            action={
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/pools/new" className="btn-primary">Create a Pool</Link>
                <Link href="/pools" className="btn-secondary">Browse Pools</Link>
              </div>
            }
          />
        ) : (
          <div className="space-y-6">
            {BRACKET_TYPE_ORDER.filter(type => bracketsByType[type]?.length).map(type => {
              const meta = BRACKET_TYPE_META[type]
              const typeBrackets = bracketsByType[type]!
              return (
                <div key={type}>
                  {BRACKET_TYPE_ORDER.filter(t => bracketsByType[t]?.length).length > 1 && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{meta.emoji}</span>
                      <span className={`font-bold text-sm ${meta.accentText}`}>{meta.label}</span>
                      <span className="text-xs text-brand-muted">({typeBrackets.length})</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {typeBrackets.map((bracket) => {
                      const picks = (bracket.picks || {}) as Record<string, string>
                      const intel = bracketIntelligence.get(bracket.id)
                      return (
                        <Link
                          key={bracket.id}
                          href={`/brackets/${bracket.id}`}
                          className={`block bg-brand-surface border rounded-xl p-4 hover:border-brand-orange/50 transition-all group ${
                            type !== 'full' ? meta.accentBorder : 'border-brand-border'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="text-lg shrink-0">{meta.emoji}</div>
                              <div className="min-w-0">
                                <div className="font-semibold text-sm group-hover:text-brand-orange transition-colors truncate">{bracket.name}</div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs text-brand-muted">🏆 {bracketPoolMap.get(bracket.pool_id) || 'Pool'}</span>
                                  {intel?.currentRank && (
                                    <span className="text-xs text-brand-muted">· #{intel.currentRank} of {intel.poolSize}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-right">
                                <div className="text-base font-black text-brand-orange leading-tight">
                                  {bracket.score ?? 0}
                                  {intel?.maxPossibleScore != null && (
                                    <span className="text-brand-muted font-normal text-xs"> / {intel.maxPossibleScore}</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-brand-muted">pts</div>
                              </div>
                              <ArrowRight size={14} className="text-brand-muted group-hover:text-white transition-colors" />
                            </div>
                          </div>
                          <BracketRoundBreakdown picks={picks} games={games} />
                          {intel && <BracketCardIntelligence intel={intel} />}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── PRIORITY 2: Live Games (only when something is live) ── */}
      <LiveGames userPickIds={userPickIds} />

      {/* ── PRIORITY 3: Single contextual banner ── */}
      {isFullBracketBusted && hasSecondChanceOpen ? (
        <SecondChanceBanner openTypes={openBracketTypes.filter(t => t !== 'full')} />
      ) : !tournamentStarted ? (
        /* Slim pre-tournament countdown */
        <div className="flex items-center justify-between gap-4 bg-brand-orange/5 border border-brand-orange/20 rounded-xl px-4 py-3">
          <span className="text-sm">🏀 <span className="font-semibold">Selection Sunday Mar 16</span> <span className="text-brand-muted">· Tipoff Mar 19</span></span>
          <Link href="/pools/new" className="btn-primary text-xs whitespace-nowrap py-1.5 px-3">
            Start a Pool →
          </Link>
        </div>
      ) : hasSecondChanceOpen ? (
        <div className="flex items-center gap-4 bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3">
          <RefreshCw size={16} className="text-blue-400 shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-bold text-blue-400">2nd Chance Brackets open: </span>
            <span className="text-brand-muted">{openBracketTypes.filter(t => t !== 'full').map(t => BRACKET_TYPE_META[t].shortLabel).join(', ')}</span>
          </div>
          <Link href="/second-chance" className="btn-secondary text-xs whitespace-nowrap py-1.5 px-3 flex items-center gap-1">
            <RefreshCw size={12} /> Learn More
          </Link>
        </div>
      ) : null}

      {/* ── PRIORITY 4: Pools with leaderboard preview ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Your Pools</h2>
          <Link href="/pools/new" className="text-brand-orange text-sm hover:underline flex items-center gap-1">
            New pool <ArrowRight size={14} />
          </Link>
        </div>

        {!membershipsWithPools.length ? (
          <EmptyState
            title="No pools yet"
            desc="Create a pool and invite your crew, or join one with an invite code."
            action={<Link href="/pools/new" className="btn-primary">Create Your First Pool</Link>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {membershipsWithPools.map((m) => {
              const pool = m.pool!
              const poolType = (pool.bracket_type || 'full') as BracketType
              const poolMeta = BRACKET_TYPE_META[poolType]
              const lb = poolLeaderboards.get(pool.id)
              const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/join/${pool.invite_code}`
              return (
                <Link
                  key={pool.id}
                  href={`/pools/${pool.id}`}
                  className="bg-brand-surface border border-brand-border rounded-xl p-3 hover:border-brand-orange/50 transition-all group flex flex-col"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Trophy size={14} className="text-brand-orange shrink-0" />
                      <h3 className="font-bold text-sm group-hover:text-brand-orange transition-colors truncate">{pool.name}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {poolType !== 'full' && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${poolMeta.accentBg} ${poolMeta.accentText} border ${poolMeta.accentBorder}`}>
                          {poolMeta.badge}
                        </span>
                      )}
                      <PoolStatusBadge status={pool.status} />
                    </div>
                  </div>
                  {lb && (
                    <PoolLeaderboardPreview
                      entries={lb.entries}
                      currentUserId={session.user.id}
                      currentUserRank={lb.currentUserRank}
                      currentUserScore={lb.currentUserScore}
                      totalMembers={lb.totalMembers}
                      tournamentStarted={tournamentStarted}
                    />
                  )}
                  {/* Inline invite link for non-locked pools */}
                  {pool.status !== 'completed' && pool.status !== 'locked' && (
                    <div className="mt-2 pt-2 border-t border-brand-border/50 flex items-center justify-between">
                      <span className="text-[10px] text-brand-muted">{m.role === 'commissioner' ? '👑 Commissioner' : '👤 Member'}</span>
                      <a
                        href={inviteUrl}
                        onClick={e => e.stopPropagation()}
                        className="text-[10px] text-brand-orange hover:underline flex items-center gap-1"
                      >
                        <Share2 size={10} /> Invite
                      </a>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* ── BOTTOM: Social / ambient content ── */}
      <AchievementsPanel userId={session.user.id} />
      <RecentAchievements userId={session.user.id} />

      {poolIds.length > 0 && (
        <AllSmack
          poolIds={poolIds}
          poolNames={Object.fromEntries(pools.map(p => [p.id, p.name]))}
          currentUserId={session.user.id}
        />
      )}

      <section>
        <NewsFeed />
      </section>

      {/* Notification prompt — low priority, bottom of page */}
      <NotificationPrompt trigger="first_visit" className="max-w-xl" />
    </div>
  )
}

function SecondChanceBanner({ openTypes }: { openTypes: BracketType[] }) {
  const primary = openTypes[0]
  const meta = BRACKET_TYPE_META[primary]

  return (
    <div className={`${meta.accentBg} border-2 ${meta.accentBorder} rounded-2xl p-6`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="text-4xl">{meta.emoji}</div>
        <div className="flex-1">
          <div className={`font-black text-lg ${meta.accentText}`}>
            💀 Bracket Busted? Start Fresh.
          </div>
          <p className="text-brand-muted text-sm mt-1">
            Your bracket is mathematically eliminated, but the tournament isn&apos;t over.
            Jump into a {openTypes.map(t => BRACKET_TYPE_META[t].shortLabel).join(' or ')} bracket and get back in the game!
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Link
            href={`/pools/new?bracket_type=${primary}`}
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            <Zap size={14} />
            Start Fresh
          </Link>
          <Link href="/second-chance" className="text-center text-xs text-brand-muted hover:text-white transition-colors">
            Learn more →
          </Link>
        </div>
      </div>
    </div>
  )
}


function PoolStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: 'bg-green-500/10 text-green-400 border-green-500/20',
    active: 'bg-brand-orange/10 text-brand-orange border-brand-orange/20',
    locked: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    completed: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    draft: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles[status] || styles.open}`}>
      {status}
    </span>
  )
}

function EmptyState({ title, desc, action }: { title: string; desc: string; action: React.ReactNode }) {
  return (
    <div className="bg-brand-surface border border-dashed border-brand-border rounded-2xl p-10 text-center">
      <div className="text-4xl mb-3">🏀</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-brand-muted text-sm mb-6 max-w-xs mx-auto">{desc}</p>
      {action}
    </div>
  )
}
