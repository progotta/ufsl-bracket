import { createServerClient, createReadClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ManageDashboard from './ManageDashboard'

interface Props {
  params: { id: string }
}

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function ManagePoolPage({ params }: Props) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth')

  const adminDb = createReadClient()

  const { data: pool } = await adminDb
    .from('pools')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!pool) notFound()
  if (pool.commissioner_id !== session.user.id) notFound()

  // Get members with profiles
  const { data: members } = await adminDb
    .from('pool_members')
    .select('id, user_id, role, payment_status, payment_date, payment_note, created_at, profiles(display_name, avatar_url)')
    .eq('pool_id', params.id)

  // Get brackets for this pool
  const { data: brackets } = await adminDb
    .from('brackets')
    .select('id, user_id, name, is_submitted, score, created_at, updated_at')
    .eq('pool_id', params.id)

  // Current profile for nav
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle()

  const entryFee = Number(pool.entry_fee) || 0
  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/join/${pool.invite_code}`

  // Build member data with bracket + payment info
  const memberData = (members || []).map((m: any) => {
    const profile = m.profiles as any
    const bracket = brackets?.find(b => b.user_id === m.user_id)
    return {
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      display_name: profile?.display_name || 'Anonymous',
      avatar_url: profile?.avatar_url || null,
      payment_status: m.payment_status || 'unpaid',
      payment_date: m.payment_date,
      has_submitted: !!bracket?.is_submitted,
      bracket_name: bracket?.name || null,
      bracket_submitted_at: bracket?.is_submitted ? bracket.updated_at : null,
      score: bracket?.score || 0,
      joined_at: m.created_at,
    }
  })

  return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={`/pools/${params.id}`} className="text-brand-muted hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black">Manage Pool</h1>
            <p className="text-brand-muted text-sm">{pool.name}</p>
          </div>
        </div>

        <ManageDashboard
          poolId={params.id}
          poolName={pool.name}
          poolStatus={pool.status}
          entryFee={entryFee}
          maxMembers={pool.max_members}
          inviteUrl={inviteUrl}
          inviteCode={pool.invite_code}
          members={memberData}
        />
      </main>
  )
}
