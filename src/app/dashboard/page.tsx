import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trophy, Users, ArrowRight, Calendar } from 'lucide-react'
import type { Profile, Bracket, Pool } from '@/types/database'
import NewsFeed from '@/components/NewsFeed'

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

  const displayName = profile?.display_name || session.user.email?.split('@')[0] || 'Champion'
  const totalScore = brackets.reduce((sum, b) => sum + (b.score || 0), 0)

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

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Pools" value={membershipsWithPools.length} icon={<Users size={20} />} />
        <StatCard label="Brackets" value={brackets.length} icon={<Trophy size={20} />} />
        <StatCard label="Total Points" value={totalScore} icon={<Trophy size={20} className="text-brand-gold" />} />
        <StatCard
          label="Tournament"
          value="Mar 19"
          icon={<Calendar size={20} />}
          sublabel="Tip-off"
        />
      </div>

      {/* Tournament countdown */}
      <div className="bg-gradient-to-r from-brand-orange/10 to-brand-gold/10 border border-brand-orange/20 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="text-4xl">🏀</div>
          <div className="flex-1">
            <h2 className="text-lg font-bold">Selection Sunday is March 16!</h2>
            <p className="text-brand-muted text-sm mt-1">
              The bracket is revealed Sunday evening. Submit your picks before tipoff on March 19.
            </p>
          </div>
          <Link href="/pools/new" className="btn-primary text-sm whitespace-nowrap">
            Start a Pool →
          </Link>
        </div>
      </div>

      {/* Pools section */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {membershipsWithPools.map((m) => {
              const pool = m.pool!
              return (
                <Link
                  key={pool.id}
                  href={`/pools/${pool.id}`}
                  className="bg-brand-surface border border-brand-border rounded-xl p-5 hover:border-brand-orange/50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-brand-orange/10 rounded-lg p-2">
                      <Trophy size={20} className="text-brand-orange" />
                    </div>
                    <PoolStatusBadge status={pool.status} />
                  </div>
                  <h3 className="font-bold text-base group-hover:text-brand-orange transition-colors">{pool.name}</h3>
                  {pool.description && (
                    <p className="text-brand-muted text-xs mt-1 line-clamp-2">{pool.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs text-brand-muted">{m.role === 'commissioner' ? '👑 Commissioner' : '👤 Member'}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Brackets section */}
      {brackets.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Your Brackets</h2>
          <div className="space-y-3">
            {brackets.map((bracket) => (
              <Link
                key={bracket.id}
                href={`/brackets/${bracket.id}`}
                className="flex items-center justify-between bg-brand-surface border border-brand-border rounded-xl p-4 hover:border-brand-orange/50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">📋</div>
                  <div>
                    <div className="font-semibold group-hover:text-brand-orange transition-colors">{bracket.name}</div>
                    <div className="text-xs text-brand-muted">{bracketPoolMap.get(bracket.pool_id) || 'Pool'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xl font-black text-brand-orange">{bracket.score}</div>
                    <div className="text-xs text-brand-muted">points</div>
                  </div>
                  <ArrowRight size={16} className="text-brand-muted group-hover:text-white transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* News Feed */}
      <section>
        <NewsFeed />
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  sublabel,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  sublabel?: string
}) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-brand-muted">{icon}</span>
      </div>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-xs text-brand-muted">{sublabel || label}</div>
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
