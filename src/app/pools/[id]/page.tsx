import { createServerClient, createServiceClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy, Users, Link as LinkIcon, Settings, Plus, Wrench, Eye } from 'lucide-react'
import dynamic from 'next/dynamic'
import ShareStandingsCard from '@/components/pools/ShareStandingsCard'
import InviteSection from '@/components/pools/InviteSection'
import PoolLeaderboard from '@/components/pools/Leaderboard'
import ShareButton from '@/components/bracket/ShareButton'
import CommissionerActions from '@/components/pools/CommissionerActions'
import LeagueNotes from '@/components/pools/LeagueNotes'
import PaymentTrackerClient from '@/components/pools/PaymentTrackerClient'
import StripeConnectSection from '@/components/pools/StripeConnectSection'
import PaymentOptions from '@/components/pools/PaymentOptions'
import PayNowButton from '@/components/pools/PayNowButton'
import StripeStatusBanner from '@/components/pools/StripeStatusBanner'
import { calculatePayouts, formatCurrency, type PayoutStructure } from '@/lib/payouts'
import { FEATURES } from '@/lib/features'
import RealtimeStatus from '@/components/ui/RealtimeStatus'
import PlayerAvatar from '@/components/ui/PlayerAvatar'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

// Lazy-load heavy client components to reduce initial bundle
const Leaderboard = dynamic(() => import('@/components/Leaderboard'), {
  loading: () => (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 min-h-[200px] flex items-center justify-center">
      <div className="text-brand-muted animate-pulse text-sm">Loading leaderboard…</div>
    </div>
  ),
  ssr: false,
})

const SmackTalk = dynamic(() => import('@/components/smack/SmackTalk'), {
  loading: () => (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 min-h-[120px] flex items-center justify-center">
      <div className="text-brand-muted animate-pulse text-sm">Loading smack talk…</div>
    </div>
  ),
  ssr: false,
})
import { BRACKET_TYPE_META, isBracketTypeOpen, type BracketType } from '@/lib/secondChance'

interface Props {
  params: { id: string }
}

export const revalidate = 60

export default async function PoolPage({ params }: Props) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth')

  const { data: pool } = await supabase
    .from('pools')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!pool) notFound()

  // Check if user is a member
  const { data: membership } = await supabase
    .from('pool_members')
    .select('role')
    .eq('pool_id', params.id)
    .eq('user_id', session.user.id)
    .single()

  if (!membership && !pool.is_public) notFound()

  // Use adminDb for members query to get payment fields (RLS may not expose them)
  const adminDb = createServiceClient()

  // Round 2: parallelize all independent queries
  const [
    { data: members },
    { data: commissionerProfile },
    { data: userBrackets },
    { data: leaderboard },
    { data: payments },
    { data: currentProfile },
    { data: roundProgress },
    { data: allBrackets },
  ] = await Promise.all([
    adminDb
      .from('pool_members')
      .select('id, user_id, role, payment_status, payment_date, payment_note, profiles(display_name, avatar_url, avatar_icon)')
      .eq('pool_id', params.id),
    adminDb
      .from('profiles')
      .select('display_name, stripe_account_id, stripe_onboarded, paypal_merchant_id, paypal_onboarded')
      .eq('id', pool.commissioner_id)
      .single(),
    supabase
      .from('brackets')
      .select('*')
      .eq('pool_id', params.id)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('leaderboard')
      .select('*')
      .eq('pool_id', params.id)
      .order('rank', { ascending: true })
      .limit(50),
    adminDb
      .from('payments')
      .select('*')
      .eq('pool_id', params.id),
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle(),
    supabase
      .from('games')
      .select('round, status, winner_id'),
    adminDb
      .from('brackets')
      .select('id, user_id, is_submitted, bracket_name, name')
      .eq('pool_id', params.id),
  ])

  const userBracket = userBrackets?.[0] || null

  // Submitted bracket count per user — used to calculate each member's total owed
  const bracketCountByUser: Record<string, number> = {}
  for (const b of allBrackets || []) {
    if (b.is_submitted) {
      bracketCountByUser[b.user_id] = (bracketCountByUser[b.user_id] || 0) + 1
    }
  }
  const userBracketCount = userBrackets?.length || 0
  const maxBracketsPerMember = (pool as any).max_brackets_per_member || 1
  const feePerBracket = (pool as any).fee_per_bracket ?? true
  const onePayoutPerPerson = (pool as any).one_payout_per_person ?? false

  const isCommissioner = pool.commissioner_id === session.user.id ||
    members?.some((m: any) => m.user_id === session.user.id && m.role === 'commissioner')
  const isMember = !!membership
  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/join/${pool.invite_code}`

  // Current user's payment status + commissioner Stripe status
  const currentMember = members?.find((m: any) => m.user_id === session.user.id)
  const commissionerStripeReady = !!commissionerProfile?.stripe_onboarded && !!commissionerProfile?.stripe_account_id
  const commissionerPaypalReady = !!(commissionerProfile as any)?.paypal_onboarded && !!(commissionerProfile as any)?.paypal_merchant_id
  const poolPaymentMethods = ((pool as any).payment_methods || []) as any[]
  const venmoHandle = poolPaymentMethods.find((m: any) => m.platform === 'Venmo')?.handle || null

  // Get current user's rank from leaderboard
  const userLeaderboardEntry = leaderboard?.find(e => e.user_id === session.user.id)
  const userRank = userLeaderboardEntry?.rank ?? undefined
  const userName = currentProfile?.display_name || 'Anonymous'

  const tournamentProgress = (() => {
    if (!roundProgress || roundProgress.length === 0) return null
    const ROUND_LABELS: Record<number, string> = { 1: 'R64', 2: 'R32', 3: 'S16', 4: 'E8', 5: 'F4', 6: 'NCG' }
    const rounds = new Map<number, { total: number; completed: number }>()
    for (const g of roundProgress) {
      const r = rounds.get(g.round) || { total: 0, completed: 0 }
      r.total++
      if (g.winner_id) r.completed++
      rounds.set(g.round, r)
    }
    const sortedRounds = Array.from(rounds.entries()).sort((a, b) => a[0] - b[0])
    let currentRound = 1
    let gamesRemaining = 0
    for (const [round, { total, completed }] of sortedRounds) {
      if (completed < total) {
        currentRound = round
        gamesRemaining = total - completed
        break
      }
      currentRound = round
    }
    const allComplete = sortedRounds.every(([, { total, completed }]) => completed >= total)
    return { rounds: sortedRounds, labels: ROUND_LABELS, currentRound, gamesRemaining, allComplete }
  })()

  // Payment data
  const entryFee = (pool as any).entry_fee ? Number((pool as any).entry_fee) : 0
  const memberCount = members?.length || 0
  const paidCount = members?.filter((m: any) => m.payment_status === 'paid').length || 0
  const totalPot = memberCount * entryFee
  const payouts = entryFee > 0 && (pool as any).payout_structure
    ? calculatePayouts(totalPot, (pool as any).payout_structure as PayoutStructure, paidCount)
    : []

  return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <RealtimeStatus />
      {/* Stripe/Payment status banners */}
      <StripeStatusBanner />

      {/* Tournament Progress */}
      {tournamentProgress && tournamentProgress.rounds.length > 0 && (
        <div className="bg-brand-surface border border-brand-border rounded-xl px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-bold">🏀</span>
            <div className="flex items-center gap-1 text-xs font-semibold">
              {tournamentProgress.rounds.map(([round, { total, completed }], idx) => {
                const label = tournamentProgress.labels[round] || `R${round}`
                const isComplete = completed >= total
                const isCurrent = round === tournamentProgress.currentRound && !tournamentProgress.allComplete
                return (
                  <span key={round} className="flex items-center gap-1">
                    {idx > 0 && <span className="text-brand-muted mx-0.5">&rarr;</span>}
                    <span className={
                      isCurrent ? 'text-brand-orange font-black' :
                      isComplete ? 'text-green-400' : 'text-brand-muted'
                    }>
                      {isComplete ? `✓ ${label}` : isCurrent ? `● ${label}` : label}
                    </span>
                  </span>
                )
              })}
            </div>
            <span className="text-xs text-brand-muted ml-auto">
              {tournamentProgress.allComplete ? 'Tournament complete' : `${tournamentProgress.gamesRemaining} games remaining`}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/dashboard" className="text-brand-muted hover:text-white mt-1 transition-colors md:hidden">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black">{pool.name}</h1>
            {pool.description && (
              <p className="text-brand-muted mt-1">{pool.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <PoolStatusBadge status={pool.status} />
              {pool.bracket_type && pool.bracket_type !== 'full' && (() => {
                const meta = BRACKET_TYPE_META[pool.bracket_type as BracketType]
                return (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${meta.accentBg} ${meta.accentText} border ${meta.accentBorder}`}>
                    {meta.emoji} {meta.badge}
                  </span>
                )
              })()}
              <span className="text-brand-muted text-sm flex items-center gap-1">
                <Users size={14} />
                {members?.length || 0} members
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCommissioner && (
            <>
              {FEATURES.commissionerDashboard && (
                <Link
                  href={`/pools/${params.id}/manage`}
                  className="flex items-center gap-2 bg-brand-surface hover:bg-brand-card px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-brand-border"
                >
                  <Wrench size={16} className="text-brand-orange" />
                  Manage Pool
                </Link>
              )}
              <Link href={`/pools/${params.id}/settings`} className="btn-secondary text-sm flex items-center gap-2">
                <Settings size={16} />
                Settings
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Action card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bracket action */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-brand-orange/10 rounded-xl p-2.5">
              <Trophy size={22} className="text-brand-orange" />
            </div>
            <div>
              <div className="font-bold">
                {maxBracketsPerMember > 1 ? 'Your Brackets' : 'Your Bracket'}
              </div>
              <div className="text-xs text-brand-muted">
                {userBracketCount > 0
                  ? `${userBracketCount} bracket${userBracketCount !== 1 ? 's' : ''}${maxBracketsPerMember > 1 ? ` of ${maxBracketsPerMember} max` : ''}`
                  : 'Not started'}
              </div>
            </div>
          </div>
          {userBrackets && userBrackets.length > 0 ? (
            <div className="space-y-3">
              {(() => {
                const myPayments = (payments || []).filter((p: any) => p.user_id === session.user.id)
                const allPaidOrWaived = myPayments.length > 0 && myPayments.every((p: any) => p.status === 'paid' || p.status === 'waived')
                const anyPending = myPayments.some((p: any) => p.status === 'pending_verification')
                const amountOwed = myPayments.filter((p: any) => p.status === 'unpaid').reduce((s: number, p: any) => s + (p.amount || 0), 0)
                const overallStatus = allPaidOrWaived ? 'paid' : anyPending ? 'pending_verification' : 'unpaid'

                return (
                  <>
                    {userBrackets.map((bracket, idx) => {
                      // Per-bracket payment status
                      const bracketPayment = myPayments.find((p: any) => p.bracket_id === bracket.id)
                      const bStatus = bracketPayment?.status || (entryFee > 0 ? 'unpaid' : null)

                      return (
                        <div key={bracket.id} className="flex items-center gap-2 bg-brand-card rounded-xl px-3 py-2.5">
                          {/* Bracket name + eye icon */}
                          <Link href={`/brackets/${bracket.id}`} className="flex items-center gap-1 flex-1 min-w-0 hover:opacity-80 transition-opacity" title={bracket.is_submitted ? 'View bracket' : 'Pick teams'}>
                            <span className="text-sm font-semibold text-white truncate">
                              {bracket.bracket_name || bracket.name || `Bracket ${idx + 1}`}
                            </span>
                            <Eye size={14} className="text-brand-orange shrink-0" />
                          </Link>
                          {/* Per-bracket payment status pill */}
                          {entryFee > 0 && bStatus && (
                            bStatus === 'paid' || bStatus === 'waived' ? (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 shrink-0">Paid</span>
                            ) : bStatus === 'pending_verification' ? (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shrink-0">Pending</span>
                            ) : (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">Unpaid</span>
                            )
                          )}
                          {/* Score */}
                          <span className="text-lg font-black text-brand-orange shrink-0">{bracket.score ?? 0}</span>
                        </div>
                      )
                    })}

                    {/* Consolidated payment action below all brackets */}
                    {entryFee > 0 && currentMember && (
                      <div className="mt-1">
                        {allPaidOrWaived ? (
                          <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
                            <span className="text-sm font-bold text-green-400">✅ All Brackets Paid</span>
                          </div>
                        ) : anyPending ? (
                          <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                            <span className="text-sm font-semibold text-yellow-400">⏳ Payment Pending Commissioner Approval</span>
                          </div>
                        ) : (
                          <PayNowButton
                            poolId={params.id}
                            memberId={currentMember.id}
                            userId={session.user.id}
                            entryFee={entryFee}
                            venmoHandle={venmoHandle}
                            paymentInstructions={(pool as any).payment_instructions}
                            paymentStatus={overallStatus}
                            amountOwed={amountOwed}
                          />
                        )}
                      </div>
                    )}
                  </>
                )
              })()}

              {/* Add another bracket CTA */}
              {maxBracketsPerMember > 1 && userBracketCount < maxBracketsPerMember && isBracketTypeOpen(pool.bracket_type as BracketType, (roundProgress || []) as any) && (
                <div className="mt-2 p-3 bg-brand-card/50 rounded-xl text-center">
                  <Link
                    href={`/pools/${params.id}/bracket/new`}
                    className="text-brand-orange text-sm font-bold hover:underline"
                  >
                    + Add another bracket
                  </Link>
                  {feePerBracket && entryFee > 0 && (
                    <p className="text-xs text-brand-muted mt-1">
                      Additional ${entryFee} entry fee applies
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : isMember ? (
            isBracketTypeOpen(pool.bracket_type as BracketType, (roundProgress || []) as any) ? (
            <div className="space-y-2">
              <Link
                href={`/pools/${params.id}/bracket/new`}
                className="btn-primary w-full text-center flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Start Your Bracket
              </Link>
              <p className="text-center text-xs text-brand-muted">
                Already filled one out elsewhere?{' '}
                <Link
                  href={`/pools/${params.id}/bracket/new`}
                  className="text-brand-orange hover:underline"
                >
                  Start &amp; import a screenshot →
                </Link>
              </p>
            </div>
            ) : (
              <div className="bg-brand-surface border border-brand-border rounded-xl p-4 text-center">
                <p className="text-sm font-bold text-brand-muted">Submissions Closed</p>
                <p className="text-xs text-brand-muted mt-1">The window to submit a bracket for this pool has passed.</p>
              </div>
            )
          ) : (
            <JoinPoolButton poolId={params.id} />
          )}
        </div>

        {/* Invite (pre-lock) or Share Standings (once games are underway) */}
        {pool.status === 'locked' || pool.status === 'completed' ||
         tournamentProgress?.rounds.some(([, { completed }]) => completed > 0) ? (
          <ShareStandingsCard poolName={pool.name} poolUrl={`${process.env.NEXT_PUBLIC_SITE_URL}/pools/${pool.id}`} leaderboard={leaderboard || []} />
        ) : (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-500/10 rounded-xl p-2.5">
                <LinkIcon size={22} className="text-blue-400" />
              </div>
              <div>
                <div className="font-bold">Invite Friends</div>
                <div className="text-xs text-brand-muted">Share the link to join</div>
              </div>
            </div>
            <InviteSection
              poolName={pool.name}
              inviteCode={pool.invite_code}
              inviteUrl={inviteUrl}
              inviterName={commissionerProfile?.display_name || undefined}
              memberCount={members?.length || 0}
              bracketType={pool.bracket_type}
            />
          </div>
        )}
      </div>

      {/* League Notes */}
      <LeagueNotes
        poolId={params.id}
        initialNotes={(pool as any).notes || null}
        isCommissioner={!!isCommissioner}
        notesUpdatedAt={(pool as any).notes_updated_at || null}
      />

      {/* Pool Pot */}
      {FEATURES.paidPools && entryFee > 0 && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-lg">💰 Pool Pot</h3>
            <span className="text-2xl font-black text-brand-orange">
              {formatCurrency(paidCount * entryFee)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-sm text-brand-muted mb-1">
              <span>{paidCount} of {memberCount} paid</span>
              <span>{formatCurrency(memberCount * entryFee)} when full</span>
            </div>
            <div className="h-2 bg-brand-surface rounded-full">
              <div
                className="h-2 bg-brand-orange rounded-full transition-all"
                style={{ width: `${memberCount > 0 ? (paidCount / memberCount) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Payout table */}
          {payouts.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-brand-muted font-medium">Payouts</p>
              {payouts.map(payout => (
                <div key={payout.place} className="flex justify-between items-center">
                  <span className="text-sm">{payout.label}</span>
                  <span className="font-bold text-brand-orange">
                    {formatCurrency(payout.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {(pool as any).payment_instructions && (
            <div className="mt-3 pt-3 border-t border-brand-border">
              <p className="text-xs text-brand-muted">
                💳 {(pool as any).payment_instructions}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Payment connect — commissioner only */}
      {FEATURES.paidPools && isCommissioner && entryFee > 0 && (
        <div className="space-y-3">
          {FEATURES.stripe && poolPaymentMethods.some((m: any) => m.type === 'stripe') && (
            <StripeConnectSection
              poolId={params.id}
              stripeOnboarded={!!commissionerProfile?.stripe_onboarded}
              stripeAccountId={commissionerProfile?.stripe_account_id || null}
            />
          )}
          {poolPaymentMethods.some((m: any) => m.type === 'paypal') && (
            commissionerPaypalReady ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                <span className="text-green-400 text-lg">&#127359;&#65039;</span>
                <div className="flex-1">
                  <p className="font-bold text-sm text-green-400">PayPal Connected</p>
                  <p className="text-xs text-brand-muted mt-0.5">Members can pay via PayPal — auto-tracked.</p>
                </div>
              </div>
            ) : (
              <div className="bg-brand-surface border border-brand-border rounded-xl p-4 flex items-center gap-3">
                <span className="text-brand-orange text-lg">&#127359;&#65039;</span>
                <div className="flex-1">
                  <p className="font-bold text-sm">Connect PayPal to Accept Payments</p>
                  <p className="text-xs text-brand-muted mt-0.5">Members pay via PayPal, auto-tracked. No chasing.</p>
                </div>
                <a
                  href={`/api/paypal/connect?pool_id=${params.id}`}
                  className="bg-[#0070ba] text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-[#005ea6] transition-colors whitespace-nowrap"
                >
                  Connect PayPal
                </a>
              </div>
            )
          )}
        </div>
      )}

      {/* Pay entry fee — member only */}
      {FEATURES.paidPools && !isCommissioner && isMember && entryFee > 0 && (currentMember?.payment_status === 'unpaid' || currentMember?.payment_status === 'pending_verification') && (
        currentMember?.payment_status === 'pending_verification' ? (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
            <span className="text-xl">&#9203;</span>
            <div>
              <p className="font-bold text-sm text-yellow-400">Payment Pending Verification</p>
              <p className="text-xs text-brand-muted mt-0.5">The commissioner will confirm your payment.</p>
            </div>
          </div>
        ) : (
          <PaymentOptions
            poolId={params.id}
            entryFee={entryFee}
            paymentMethods={poolPaymentMethods}
            commissionerStripeReady={commissionerStripeReady}
            commissionerPaypalReady={commissionerPaypalReady}
            memberId={currentMember?.id || ''}
          />
        )
      )}

      {/* Commissioner Actions */}
      {isCommissioner && (
        <CommissionerActions
          poolId={params.id}
          poolStatus={pool.status}
          leaderboard={(leaderboard || []).map(e => ({
            display_name: e.display_name,
            score: e.score,
            bracket_name: e.bracket_name,
          }))}
        />
      )}

      {/* Leaderboard — tabbed (Pool / Global / Friends) */}
      <ErrorBoundary>
        <Leaderboard
          poolId={params.id}
          currentUserId={session.user.id}
          defaultTab="pool"
          showTabs={true}
          entryFee={entryFee}
          payouts={payouts}
          maxBracketsPerMember={maxBracketsPerMember}
          onePayoutPerPerson={onePayoutPerPerson}
        />
      </ErrorBoundary>

      {/* Smack Talk */}
      {isMember && (
        <ErrorBoundary>
          <SmackTalk
            poolId={params.id}
            currentUserId={session.user.id}
            currentUserName={null}
          />
        </ErrorBoundary>
      )}

      {/* Payment Tracker — commissioner only */}
      {FEATURES.paidPools && isCommissioner && entryFee > 0 && (
        <PaymentTrackerClient
          members={(members || []) as any}
          allBrackets={(allBrackets || []) as any}
          initialPayments={(payments || []).map((p: any) => ({ ...p, amount: Number(p.amount) || 0 }))}
          entryFee={entryFee}
          poolId={pool.id}
        />
      )}

      {/* Members */}
      <section>
        <h2 className="text-xl font-bold mb-4">Members ({members?.length || 0})</h2>
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          {members?.map((member, idx) => {
            const profile = member.profiles as any
            return (
              <div
                key={member.user_id}
                className={`flex items-center gap-4 px-5 py-4 ${idx > 0 ? 'border-t border-brand-border' : ''}`}
              >
                <PlayerAvatar
                  userId={member.user_id}
                  displayName={profile?.display_name}
                  avatarUrl={profile?.avatar_url}
                  avatarIcon={profile?.avatar_icon}
                  size="w-9 h-9"
                  borderClass="border-brand-border/40"
                />
                <div className="flex-1">
                  <div className="font-medium">{profile?.display_name || 'Anonymous'}</div>
                </div>
                {member.role === 'commissioner' && (
                  <span className="text-xs text-brand-gold">👑 Commissioner</span>
                )}
                {entryFee > 0 && (() => {
                  const memberPmts = (payments || []).filter((p: any) => p.user_id === member.user_id)
                  const memberBracketTotal = (allBrackets || []).filter((b: any) => b.user_id === member.user_id && b.is_submitted).length
                  const memberPaidCount = memberPmts.filter((p: any) => p.status === 'paid' || p.status === 'waived').length
                  const memberOwed = memberPmts.filter((p: any) => p.status === 'unpaid' || p.status === 'pending_verification').reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0)
                  if (memberPmts.length === 0) return null
                  const allPaid = memberOwed === 0 && memberPaidCount > 0
                  const partial = memberPaidCount > 0 && memberOwed > 0
                  return (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${
                      allPaid ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : partial ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {allPaid ? 'Paid ✓' : partial ? `${memberPaidCount}/${memberBracketTotal} paid` : `$${memberOwed.toFixed(0)} owed`}
                    </span>
                  )
                })()}
              </div>
            )
          })}
        </div>
      </section>
      </main>
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
    <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${styles[status] || styles.open}`}>
      {status.toUpperCase()}
    </span>
  )
}

function JoinPoolButton({ poolId }: { poolId: string }) {
  return (
    <Link href={`/join?pool=${poolId}`} className="btn-primary w-full text-center block">
      Join This Pool
    </Link>
  )
}
