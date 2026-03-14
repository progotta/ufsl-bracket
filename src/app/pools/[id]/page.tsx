import { createServerClient, createReadClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy, Users, Link as LinkIcon, Settings, Plus } from 'lucide-react'
import dynamic from 'next/dynamic'
import InviteSection from '@/components/pools/InviteSection'
import PoolLeaderboard from '@/components/pools/Leaderboard'
import ShareButton from '@/components/bracket/ShareButton'
import CommissionerActions from '@/components/pools/CommissionerActions'
import PaymentToggle from '@/components/pools/PaymentToggle'
import StripeConnectSection from '@/components/pools/StripeConnectSection'
import PaymentOptions from '@/components/pools/PaymentOptions'
import StripeStatusBanner from '@/components/pools/StripeStatusBanner'
import Nav from '@/components/layout/Nav'
import { calculatePayouts, formatCurrency, type PayoutStructure } from '@/lib/payouts'

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
import { BRACKET_TYPE_META, type BracketType } from '@/lib/secondChance'

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
  const adminDb = createReadClient()
  const { data: members } = await adminDb
    .from('pool_members')
    .select('id, user_id, role, payment_status, payment_date, payment_note, profiles(display_name, avatar_url)')
    .eq('pool_id', params.id)

  const { data: commissionerProfile } = await adminDb
    .from('profiles')
    .select('display_name, stripe_account_id, stripe_onboarded, paypal_merchant_id, paypal_onboarded')
    .eq('id', pool.commissioner_id)
    .single()

  const { data: userBracket } = await supabase
    .from('brackets')
    .select('*')
    .eq('pool_id', params.id)
    .eq('user_id', session.user.id)
    .single()

  const { data: leaderboard } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('pool_id', params.id)
    .order('rank', { ascending: true })
    .limit(50)

  const isCommissioner = pool.commissioner_id === session.user.id
  const isMember = !!membership
  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/join/${pool.invite_code}`

  // Current user's payment status + commissioner Stripe status
  const currentMember = members?.find((m: any) => m.user_id === session.user.id)
  const commissionerStripeReady = !!commissionerProfile?.stripe_onboarded && !!commissionerProfile?.stripe_account_id
  const commissionerPaypalReady = !!(commissionerProfile as any)?.paypal_onboarded && !!(commissionerProfile as any)?.paypal_merchant_id
  const poolPaymentMethods = ((pool as any).payment_methods || []) as any[]

  // Get current user's profile for share + nav
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle()

  // Get current user's rank from leaderboard
  const userLeaderboardEntry = leaderboard?.find(e => e.user_id === session.user.id)
  const userRank = userLeaderboardEntry?.rank ?? undefined
  const userName = currentProfile?.display_name || 'Anonymous'

  // Tournament progress: count games by round
  const { data: roundProgress } = await supabase
    .from('games')
    .select('round, status, winner_id')

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
    <div className="min-h-screen bg-brand-dark">
      <Nav profile={currentProfile} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
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
                      {isCurrent ? `${label}` : label}
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
            <Link href={`/pools/${params.id}/settings`} className="btn-secondary text-sm flex items-center gap-2">
              <Settings size={16} />
              Settings
            </Link>
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
              <div className="font-bold">Your Bracket</div>
              <div className="text-xs text-brand-muted">
                {userBracket ? (userBracket.is_submitted ? 'Submitted ✓' : 'In progress') : 'Not started'}
              </div>
            </div>
          </div>
          {userBracket ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-brand-card rounded-xl p-3">
                <span className="text-sm text-brand-muted">Score</span>
                <span className="text-2xl font-black text-brand-orange">{userBracket.score}</span>
              </div>
              <div className="flex gap-2">
                <Link href={`/brackets/${userBracket.id}`} className="btn-primary flex-1 text-center block">
                  {userBracket.is_submitted ? 'View Bracket' : 'Continue Picking'}
                </Link>
                {userBracket.is_submitted && (
                  <ShareButton
                    bracketId={userBracket.id}
                    userName={userName}
                    poolName={pool.name}
                    score={userBracket.score || 0}
                    rank={userRank}
                    poolStatus={pool.status}
                    className="btn-secondary flex items-center gap-2 text-sm px-4"
                    label="Share"
                  />
                )}
              </div>
            </div>
          ) : isMember ? (
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
            <JoinPoolButton poolId={params.id} />
          )}
        </div>

        {/* Invite */}
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
      </div>

      {/* Pool Pot */}
      {entryFee > 0 && (
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
      {isCommissioner && entryFee > 0 && (
        <div className="space-y-3">
          {poolPaymentMethods.some((m: any) => m.type === 'stripe') && (
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
      {!isCommissioner && isMember && entryFee > 0 && (currentMember?.payment_status === 'unpaid' || currentMember?.payment_status === 'pending_verification') && poolPaymentMethods.length > 0 && (
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
      <Leaderboard
        poolId={params.id}
        currentUserId={session.user.id}
        defaultTab="pool"
        showTabs={true}
        entryFee={entryFee}
        payouts={payouts}
      />

      {/* Smack Talk */}
      {isMember && (
        <SmackTalk
          poolId={params.id}
          currentUserId={session.user.id}
          currentUserName={null}
        />
      )}

      {/* Payment Tracker — commissioner only */}
      {isCommissioner && entryFee > 0 && (
        <section>
          <h3 className="font-black text-lg mb-3">💳 Payment Tracker</h3>
          <div className="space-y-2">
            {members?.map((member: any) => {
              const profile = member.profiles as any
              return (
                <div key={member.user_id} className="flex items-center justify-between bg-brand-surface border border-brand-border rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center text-sm font-bold text-brand-orange">
                      {(profile?.display_name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{profile?.display_name || 'Anonymous'}</p>
                      {member.payment_date && (
                        <p className="text-xs text-brand-muted">
                          Paid {new Date(member.payment_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.payment_status === 'waived' ? (
                      <span className="text-xs text-brand-muted bg-brand-surface px-2 py-1 rounded-full border border-brand-border">Waived</span>
                    ) : (
                      <PaymentToggle
                        memberId={member.id}
                        status={member.payment_status || 'unpaid'}
                        poolId={pool.id}
                        fee={entryFee}
                        memberName={profile?.display_name || undefined}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
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
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold text-sm">
                    {(profile?.display_name || '?')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium">{profile?.display_name || 'Anonymous'}</div>
                </div>
                {member.role === 'commissioner' && (
                  <span className="text-xs text-brand-gold">👑 Commissioner</span>
                )}
              </div>
            )
          })}
        </div>
      </section>
      </main>
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
