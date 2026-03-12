import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/layout/Nav'
import JoinPoolForm from '@/components/pools/JoinPoolForm'
import { Users, Trophy, Lock, AlertCircle } from 'lucide-react'
import { BRACKET_TYPE_META, type BracketType } from '@/lib/secondChance'

interface Props {
  params: { code: string }
}

export default async function JoinPage({ params }: Props) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  const code = params.code.toUpperCase()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: pool } = await db
    .from('pools')
    .select('id, name, description, status, invite_code, is_public, commissioner_id, bracket_type, max_members, join_requires_approval')
    .eq('invite_code', code)
    .single()

  // Invalid code
  if (!pool) {
    const profile = session
      ? (await supabase.from('profiles').select('*').eq('id', session.user.id).single()).data
      : null

    return (
      <div className="min-h-screen bg-brand-dark">
        <Nav profile={profile} />
        <main className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-black mb-2">Invalid Invite Code</h1>
          <p className="text-brand-muted mb-6">
            That invite code doesn&apos;t match any pool. It may have expired or been regenerated.
          </p>
          {session ? (
            <Link href="/dashboard" className="btn-primary inline-block">Go to Dashboard</Link>
          ) : (
            <Link href="/auth" className="btn-primary inline-block">Sign In</Link>
          )}
        </main>
      </div>
    )
  }

  // Get member count
  const { count: memberCount } = await supabase
    .from('pool_members')
    .select('id', { count: 'exact', head: true })
    .eq('pool_id', pool.id)

  // Get commissioner profile
  const { data: commissioner } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', pool.commissioner_id)
    .single()

  const bracketMeta = BRACKET_TYPE_META[(pool.bracket_type || 'full') as BracketType]

  // Pool is completed
  if (pool.status === 'completed') {
    return (
      <PoolErrorPage
        pool={pool}
        memberCount={memberCount || 0}
        commissioner={commissioner}
        bracketMeta={bracketMeta}
        error="completed"
        session={session}
      />
    )
  }

  // Not logged in → show preview + CTA to sign up
  if (!session) {
    return (
      <div className="min-h-screen bg-brand-dark">
        <Nav profile={null} />
        <main className="max-w-lg mx-auto px-4 py-12">
          <PoolPreviewCard
            pool={pool}
            memberCount={memberCount || 0}
            commissioner={commissioner}
            bracketMeta={bracketMeta}
          />
          <div className="mt-6 text-center">
            <Link
              href={`/auth?next=/join/${code}`}
              className="btn-primary w-full inline-block text-center text-lg py-4"
            >
              🏀 Sign up to join
            </Link>
            <p className="text-brand-muted text-sm mt-3">
              Already have an account?{' '}
              <Link href={`/auth?next=/join/${code}`} className="text-brand-orange hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </main>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  // Check if pool is full
  if (pool.max_members && (memberCount || 0) >= pool.max_members) {
    return (
      <PoolErrorPage
        pool={pool}
        memberCount={memberCount || 0}
        commissioner={commissioner}
        bracketMeta={bracketMeta}
        error="full"
        session={session}
      />
    )
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('pool_members')
    .select('id')
    .eq('pool_id', pool.id)
    .eq('user_id', session.user.id)
    .single()

  if (existing) {
    redirect(`/pools/${pool.id}`)
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <Nav profile={profile} />
      <main className="max-w-lg mx-auto px-4 py-12">
        <JoinPoolForm
          pool={pool}
          userId={session.user.id}
          memberCount={memberCount || 0}
          commissioner={commissioner}
          bracketMeta={bracketMeta}
        />
      </main>
    </div>
  )
}

// Pool preview card for unauthenticated users
function PoolPreviewCard({
  pool,
  memberCount,
  commissioner,
  bracketMeta,
}: {
  pool: { name: string; description?: string; status: string; bracket_type?: string }
  memberCount: number
  commissioner: { display_name: string | null } | null
  bracketMeta: typeof BRACKET_TYPE_META[keyof typeof BRACKET_TYPE_META]
}) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 text-center">
      <div className="text-5xl mb-4">🏀</div>
      <div className="text-brand-muted text-sm mb-1">You&apos;re invited to join</div>
      <h1 className="text-3xl font-black mb-2">{pool.name}</h1>
      {pool.description && (
        <p className="text-brand-muted mb-4">{pool.description}</p>
      )}

      <div className="grid grid-cols-3 gap-3 my-6">
        <div className="bg-brand-card rounded-xl p-3">
          <div className="text-xl font-black text-brand-orange">{memberCount}</div>
          <div className="text-xs text-brand-muted">Members</div>
        </div>
        <div className="bg-brand-card rounded-xl p-3">
          <div className="text-lg font-black">{bracketMeta.emoji}</div>
          <div className="text-xs text-brand-muted">{bracketMeta.shortLabel || 'Full'}</div>
        </div>
        <div className="bg-brand-card rounded-xl p-3">
          <StatusDot status={pool.status} />
          <div className="text-xs text-brand-muted capitalize">{pool.status}</div>
        </div>
      </div>

      {commissioner?.display_name && (
        <p className="text-sm text-brand-muted">
          Commissioner: <span className="text-white font-medium">{commissioner.display_name}</span>
        </p>
      )}
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: 'text-green-400',
    active: 'text-brand-orange',
    locked: 'text-yellow-400',
    completed: 'text-gray-400',
    draft: 'text-blue-400',
  }
  return <div className={`text-xl font-black ${colors[status] || 'text-green-400'}`}>●</div>
}

function PoolErrorPage({
  pool,
  memberCount,
  commissioner,
  bracketMeta,
  error,
  session,
}: {
  pool: { name: string; description?: string; status: string; bracket_type?: string }
  memberCount: number
  commissioner: { display_name: string | null } | null
  bracketMeta: typeof BRACKET_TYPE_META[keyof typeof BRACKET_TYPE_META]
  error: 'completed' | 'full' | 'locked'
  session: unknown
}) {
  const messages = {
    completed: { icon: '🏆', title: 'Pool Has Ended', desc: 'This bracket pool has concluded. Better luck next year!' },
    full: { icon: '😅', title: 'Pool is Full', desc: "This pool has reached its maximum number of members. You'll have to sit this one out." },
    locked: { icon: '🔒', title: 'Pool is Locked', desc: 'This pool is locked — no new picks are being accepted.' },
  }
  const msg = messages[error]

  return (
    <div className="min-h-screen bg-brand-dark">
      <Nav profile={null} />
      <main className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">{msg.icon}</div>
          <h1 className="text-2xl font-black mb-2">{msg.title}</h1>
          <p className="text-brand-muted mb-6">{msg.desc}</p>
          <PoolPreviewCard
            pool={pool}
            memberCount={memberCount}
            commissioner={commissioner}
            bracketMeta={bracketMeta}
          />
          <div className="mt-6">
            {session ? (
              <Link href="/dashboard" className="btn-primary inline-block">Go to Dashboard</Link>
            ) : (
              <Link href="/auth" className="btn-primary inline-block">Sign In</Link>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
