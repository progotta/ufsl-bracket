import { createServerClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PoolSettingsForm from '@/components/pools/PoolSettingsForm'
import JoinRequestsPanel from '@/components/pools/JoinRequestsPanel'

interface Props {
  params: { id: string }
}

export default async function PoolSettingsPage({ params }: Props) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth')

  const { data: pool } = await supabase
    .from('pools')
    .select('*')
    .eq('id', params.id)
    .eq('commissioner_id', session.user.id)
    .single()

  if (!pool) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/pools/${params.id}`} className="text-brand-muted hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-black">Pool Settings</h1>
      </div>

      <PoolSettingsForm pool={pool} />

      {/* Join requests panel — shown if approval required */}
      {(pool as any).join_requires_approval && (
        <JoinRequestsPanel poolId={params.id} />
      )}
    </div>
  )
}
