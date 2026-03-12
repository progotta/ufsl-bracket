import { createServerClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy, Users, Link as LinkIcon, Settings, Plus } from 'lucide-react'
import InviteButton from '@/components/pools/InviteButton'
import Leaderboard from '@/components/pools/Leaderboard'
import SmackTalk from '@/components/smack/SmackTalk'

interface Props {
  params: { id: string }
}

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

  const { data: members } = await supabase
    .from('pool_members')
    .select('user_id, role, profiles(display_name, avatar_url)')
    .eq('pool_id', params.id)

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/dashboard" className="text-brand-muted hover:text-white mt-1 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black">{pool.name}</h1>
            {pool.description && (
              <p className="text-brand-muted mt-1">{pool.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <PoolStatusBadge status={pool.status} />
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
              <Link href={`/brackets/${userBracket.id}`} className="btn-primary w-full text-center block">
                {userBracket.is_submitted ? 'View Bracket' : 'Continue Picking'}
              </Link>
            </div>
          ) : isMember ? (
            <Link
              href={`/pools/${params.id}/bracket/new`}
              className="btn-primary w-full text-center flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Start Your Bracket
            </Link>
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
          <div className="space-y-3">
            <div className="bg-brand-card rounded-xl p-3 flex items-center gap-2">
              <code className="text-xs text-brand-muted flex-1 truncate">{inviteUrl}</code>
            </div>
            <div className="flex gap-2">
              <div className="bg-brand-card border border-brand-border rounded-lg px-3 py-2 flex-1 text-center">
                <div className="text-xl font-black text-brand-gold">{pool.invite_code}</div>
                <div className="text-xs text-brand-muted">Invite Code</div>
              </div>
              <InviteButton inviteUrl={inviteUrl} inviteCode={pool.invite_code} />
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <Leaderboard
        entries={leaderboard || []}
        currentUserId={session.user.id}
        poolStatus={pool.status}
      />

      {/* Smack Talk */}
      {isMember && (
        <SmackTalk
          poolId={params.id}
          currentUserId={session.user.id}
          currentUserName={null}
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
