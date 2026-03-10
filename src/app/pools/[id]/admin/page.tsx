import { createServerClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import GameResultsForm from '@/components/admin/GameResultsForm'

interface Props {
  params: { id: string }
}

export default async function PoolAdminPage({ params }: Props) {
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

  const { data: games } = await supabase
    .from('games')
    .select(`
      *,
      team1:team1_id(id, name, abbreviation, seed, region),
      team2:team2_id(id, name, abbreviation, seed, region),
      winner:winner_id(id, name, abbreviation)
    `)
    .order('round')
    .order('game_number')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/pools/${params.id}`} className="text-brand-muted hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-black">Commissioner Tools</h1>
          <p className="text-brand-muted">{pool.name}</p>
        </div>
      </div>

      <div className="bg-brand-surface border border-brand-orange/20 rounded-2xl p-5">
        <p className="text-sm text-brand-muted">
          ⚡ Enter game results here. Scores update automatically for all participants.
          Only the pool commissioner can record results.
        </p>
      </div>

      <GameResultsForm games={games || []} />
    </div>
  )
}
