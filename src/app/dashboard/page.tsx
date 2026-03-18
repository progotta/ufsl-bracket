import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trophy, ArrowRight, RefreshCw, Zap } from 'lucide-react'
import PoolLeaderboardPreview from '@/components/pools/PoolLeaderboardPreview'
import PoolInviteLink from '@/components/pools/PoolInviteLink'
import type { Profile, Bracket, Pool, Game, Team } from '@/types/database'
import NewsFeed from '@/components/NewsFeed'
import AllSmack from '@/components/smack/AllSmack'
import RecentAchievements from '@/components/achievements/RecentAchievements'
import AchievementsPanel from '@/components/achievements/AchievementsPanel'
import NotificationPrompt from '@/components/NotificationPrompt'
import PlayerAvatar from '@/components/ui/PlayerAvatar'
import PhoneNudgeBanner from '@/components/PhoneNudgeBanner'
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

export const revalidate = 30

export default async function DashboardPage() {
  try {
    return await DashboardPageInner()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack?.split('\n').slice(0,5).join('\n') : ''
    return (
      <div className="p-8 bg-red-900/20 border border-red-500/30 rounded-2xl m-4">
        <h2 className="text-red-400 font-bold text-lg mb-2">Dashboard Error (debug)</h2>
        <pre className="text-red-300 text-xs whitespace-pre-wrap">{msg}</pre>
        <pre className="text-red-300/60 text-xs whitespace-pre-wrap mt-2">{stack}</pre>
      </div>
    )
  }
}

async function DashboardPageInner() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/auth')

  // Parallel fetch: profile + brackets + games + teams + memberships all at once
  const [
    { data: profileRaw },
    { data: bracketsRaw },
    { data: gamesRaw },
    { data: teamsRaw },
    { data: membershipsRaw },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
    supabase.from('brackets').select('*').eq('user_id', session.user.id).order('updated_at', { ascending: false }),
    supabase.from('games').select('id, round, status, game_number, team1_id, team2_id, winner_id, scheduled_at'),
    supabase.from('teams').select('id, name, abbreviation, seed, region, primary_color, espn_id'),
    supabase.from('pool_members').select('role, pool_id').eq('user_id', session.user.id),
  ])

  const profile = profileRaw as Profile | null
  const brackets = (bracketsRaw || []) as Bracket[]
  const games = (gamesRaw || []) as Game[]
  const teams = (teamsRaw || []) as Team[]

  // Second parallel fetch: pools + bracketPools + poolMembers (need IDs from above)
  const poolIds = (membershipsRaw || []).map(m => m.pool_id)
  const bracketPoolIds = Array.from(new Set(brackets.map(b => b.pool_id)))
  const allPoolIds = Array.from(new Set([...poolIds, ...bracketPoolIds]))

  const [
    { data: poolsRaw },
    { data: memberRows },
    { data: allPoolBracketsRaw },
  ] = await Promise.all([
    allPoolIds.length > 0
      ? supabase.from('pools').select('*').in('id', allPoolIds).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    allPoolIds.length > 0
      ? supabase.from('pool_members').select('pool_id').in('pool_id', allPoolIds)
      : Promise.resolve({ data: [] }),
    bracketPoolIds.length > 0
      ? supabase.from('brackets').select('*').in('pool_id', bracketPoolIds).not('picks', 'is', null)
      : Promise.resolve({ data: [] }),
  ])

  const pools = (poolsRaw || []) as Pool[]
  const poolMap = new Map(pools.map(p => [p.id, p]))
  const bracketPoolMap = new Map(pools.map(p => [p.id, p.name]))
  const membershipsWithPools = (membershipsRaw || []).map(m => ({
    role: m.role,
    pool: poolMap.get(m.pool_id),
  })).filter(m => m.pool)

  const poolMemberCounts = new Map<string, number>()
  for (const row of memberRows || []) {
    poolMemberCounts.set(row.pool_id, (poolMemberCounts.get(row.pool_id) ?? 0) + 1)
  }

  const allPoolBrackets = new Map<string, Bracket[]>()
  for (const b of (allPoolBracketsRaw || []) as Bracket[]) {
    if (!allPoolBrackets.has(b.pool_id)) allPoolBrackets.set(b.pool_id, [])
    allPoolBrackets.get(b.pool_id)!.push(b)
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
        <div className="flex items-center gap-4">
          <PlayerAvatar
            userId={session.user.id}
            displayName={displayName}
            avatarUrl={profile?.avatar_url}
            avatarIcon={profile?.avatar_icon}
            size="w-12 h-12"
            borderClass="border-brand-orange/50"
          />
          <div>
            <h1 className="text-3xl font-black">
              Hey, <span className="bg-brand-gradient bg-clip-text text-transparent">{displayName}</span> 👋
            </h1>
            <p className="text-brand-muted mt-1">
              2026 NCAA Tournament • March 19 – April 6
            </p>
          </div>
        </div>
        <Link href="/pools/new" className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus size={18} />
          Create Pool
        </Link>
      </div>

      {/* Phone-only account nudge — only visible to phone-only users */}
      <PhoneNudgeBanner />

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
              const typeBrackets = bracketsByType[type] ?? []
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
                      const poolStatus = poolMap.get(bracket.pool_id)?.status || 'open'
                      const pickCount = Object.keys(picks).length
                      const isComplete = pickCount >= 63
                      const showCompletionBadge = poolStatus === 'open'

                      return (
                        <Link
                          key={bracket.id}
                          href={`/brackets/${bracket.id}`}
                          className={`block bg-brand-surface border rounded-xl p-4 hover:border-brand-orange/50 transition-all group ${
                            type !== 'full' ? meta.accentBorder : 'border-brand-border'
                          }`}
                        >
                          {/* Row 1: Name/Pool (left) | Rank + Score (right) */}
                          <div className="flex items-start justify-between gap-3">
                            {/* Left: Icon + Name + Pool + Champion */}
                            <div className="flex items-start gap-2 min-w-0">
                              <span className="text-lg shrink-0 mt-0.5">{meta.emoji}</span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                  <span className="font-semibold text-sm group-hover:text-brand-orange transition-colors truncate">{bracket.bracket_name || bracket.name}</span>
                                  {showCompletionBadge && (
                                    isComplete ? (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 bg-green-500/20 text-green-400 border-green-500/30">
                                        ✓ Complete
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 bg-red-500/20 text-red-400 border-red-500/30">
                                        ⚠ Incomplete · {pickCount}/63
                                      </span>
                                    )
                                  )}
                                  {intel?.source && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${
                                      intel.source === 'ESPN' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                      intel.source === 'CBS' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                      intel.source === 'Yahoo' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                      'bg-brand-orange/20 text-brand-orange border-brand-orange/30'
                                    }`}>{intel.source}</span>
                                  )}
                                </div>
                                <div className="text-xs text-brand-muted mt-0.5">{bracketPoolMap.get(bracket.pool_id) || 'Pool'}</div>
                                {intel?.championAbbreviation && (
                                  <div className="flex items-center gap-1 mt-0.5 text-xs text-brand-muted">
                                    <span>🏆</span>
                                    <span className={intel.championAlive === false ? 'line-through opacity-50' : intel.championAlive ? 'text-green-400' : ''}>
                                      {intel.championAbbreviation}
                                    </span>
                                    {intel.championPopularity != null && (
                                      <span className="opacity-50">· {intel.championPopularity}% picked</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right: Rank + Score */}
                            <div className="text-right shrink-0 flex items-center gap-3">
                              {intel?.currentRank && intel.poolSize > 0 && (
                                <div className="flex flex-col items-center">
                                  <span className="text-2xl font-black text-white leading-none">#{intel.currentRank}</span>
                                  <span className="text-[10px] text-brand-muted">of {intel.poolSize}</span>
                                </div>
                              )}
                              <div>
                                <div className="text-base font-black text-brand-orange leading-tight">
                                  {bracket.score ?? 0}
                                  {intel?.maxPossibleScore != null && intel.maxPossibleScore > (bracket.score ?? 0) && (
                                    <span className="text-brand-muted font-normal text-xs"> / {intel.maxPossibleScore}</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-brand-muted">pts</div>
                              </div>
                            </div>
                          </div>

                          {/* Row 2: Round breakdown — full width */}
                          <div className="mt-3">
                            <BracketRoundBreakdown picks={picks} games={games} />
                          </div>

                          {/* Next game */}
                          {intel?.nextGame && (intel.nextGame.team1Abbr !== 'TBD' || intel.nextGame.team2Abbr !== 'TBD') && (
                            <div className="text-[10px] text-brand-muted text-right mt-2">
                              {intel.nextGame.isLive && <span className="text-red-400 font-bold">LIVE · </span>}
                              {intel.nextGame.team1Abbr} vs {intel.nextGame.team2Abbr}
                              {intel.nextGame.scheduledAt && !intel.nextGame.isLive && (
                                <span className="block opacity-70">
                                  {new Date(intel.nextGame.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          )}
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
                  {!brackets.some(b => b.pool_id === pool.id) && pool.status !== 'completed' && pool.status !== 'locked' ? (
                    <div className="my-2 bg-brand-orange/5 border border-brand-orange/20 rounded-lg p-3 text-center">
                      <p className="text-xs text-brand-muted mb-2">You haven&apos;t picked a bracket yet!</p>
                      <span className="text-xs font-bold text-brand-orange group-hover:underline">
                        Pick your bracket →
                      </span>
                    </div>
                  ) : (
                    <PoolLeaderboardPreview
                      entries={lb?.entries ?? []}
                      currentUserId={session.user.id}
                      currentUserRank={lb?.currentUserRank}
                      currentUserScore={lb?.currentUserScore}
                      totalMembers={lb?.totalMembers ?? (poolMemberCounts.get(pool.id) ?? 0)}
                      tournamentStarted={tournamentStarted}
                    />
                  )}
                  {/* Inline invite link for non-locked pools */}
                  {pool.status !== 'completed' && pool.status !== 'locked' && (
                    <div className="mt-2 pt-2 border-t border-brand-border/50 flex items-center justify-between">
                      <span className="text-[10px] text-brand-muted">{m.role === 'commissioner' ? '👑 Commissioner' : '👤 Member'}</span>
                      <PoolInviteLink inviteUrl={inviteUrl} />
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
            Your bracket is cooked. Start fresh.
          </div>
          <p className="text-brand-muted text-sm mt-1">
            Join a 2nd Chance pool or start your own.
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Link
            href={`/pools/new?bracket_type=${primary}`}
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            <Zap size={14} />
            Join a 2nd Chance Pool
          </Link>
          <Link
            href={`/pools/new?bracket_type=${primary}&source=busted`}
            className="text-center text-xs text-brand-orange hover:underline font-semibold mt-2 block"
          >
            Or start your own pool — takes 60 seconds →
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
  const config: Record<string, { label: string; style: string }> = {
    open:      { label: 'Open',       style: 'bg-green-500/10 text-green-400 border-green-500/20' },
    active:    { label: 'Live 🔴',    style: 'bg-brand-orange/10 text-brand-orange border-brand-orange/20' },
    locked:    { label: 'Locked',     style: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    completed: { label: 'Final',      style: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
    draft:     { label: 'Draft',      style: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  }
  const { label, style } = config[status] || config.open
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${style}`}>
      {label}
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
