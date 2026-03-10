import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trophy, Users, ArrowRight } from 'lucide-react'

export default async function PoolsPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth')

  const { data: memberships } = await supabase
    .from('pool_members')
    .select(`
      role,
      pools (
        id, name, description, status, invite_code, commissioner_id, created_at
      )
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Your Pools</h1>
          <p className="text-brand-muted mt-1">Manage your bracket pools</p>
        </div>
        <div className="flex gap-3">
          <Link href="/join" className="btn-secondary flex items-center gap-2">
            Join Pool
          </Link>
          <Link href="/pools/new" className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            New Pool
          </Link>
        </div>
      </div>

      {!memberships?.length ? (
        <div className="bg-brand-surface border border-dashed border-brand-border rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4">🏀</div>
          <h2 className="text-2xl font-bold mb-2">No pools yet</h2>
          <p className="text-brand-muted mb-8 max-w-sm mx-auto">
            Create a pool and challenge your friends, or join an existing one with an invite code.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/pools/new" className="btn-primary">Create a Pool</Link>
            <Link href="/join" className="btn-secondary">Join with Code</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {memberships.map((m) => {
            const pool = m.pools as any
            if (!pool) return null
            return (
              <Link
                key={pool.id}
                href={`/pools/${pool.id}`}
                className="bg-brand-surface border border-brand-border rounded-2xl p-6 hover:border-brand-orange/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-brand-orange/10 rounded-xl p-2.5">
                    <Trophy size={22} className="text-brand-orange" />
                  </div>
                  <PoolStatusBadge status={pool.status} />
                </div>

                <h3 className="font-bold text-lg mb-1 group-hover:text-brand-orange transition-colors line-clamp-1">
                  {pool.name}
                </h3>
                {pool.description && (
                  <p className="text-brand-muted text-sm mb-4 line-clamp-2">{pool.description}</p>
                )}

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-brand-border">
                  <span className="text-xs text-brand-muted">
                    {m.role === 'commissioner' ? '👑 Commissioner' : '👤 Member'}
                  </span>
                  <ArrowRight size={16} className="text-brand-muted group-hover:text-white transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
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
    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${styles[status] || styles.open}`}>
      {status}
    </span>
  )
}
