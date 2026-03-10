import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Nav from '@/components/layout/Nav'
import BracketPicker from '@/components/bracket/BracketPicker'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MOCK_TEAMS } from '@/lib/bracket'
import type { BracketTeam } from '@/lib/bracket'
import type { Team } from '@/types/database'

interface Props {
  params: { bracketId: string }
}

function teamToPickerTeam(t: Team): BracketTeam {
  return {
    id: t.id,
    name: t.name,
    abbreviation: t.abbreviation,
    seed: t.seed || 1,
    region: t.region || 'East',
    primaryColor: t.primary_color || undefined,
  }
}

export default async function BracketPage({ params }: Props) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const { data: bracket } = await supabase
    .from('brackets')
    .select('*, pools(name, status, id)')
    .eq('id', params.bracketId)
    .single()

  if (!bracket) redirect('/dashboard')

  // Only the owner or pool members can view
  if (bracket.user_id !== session.user.id) {
    const { data: membership } = await supabase
      .from('pool_members')
      .select('id')
      .eq('pool_id', bracket.pool_id)
      .eq('user_id', session.user.id)
      .single()
    if (!membership) redirect('/dashboard')
  }

  // Try to load teams from DB; fall back to mock data
  const { data: dbTeams } = await supabase.from('teams').select('*').eq('is_active', true)
  const teams: BracketTeam[] = dbTeams && dbTeams.length >= 64
    ? dbTeams.map(teamToPickerTeam)
    : MOCK_TEAMS

  const pool = bracket.pools as any
  const isOwner = bracket.user_id === session.user.id

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col">
      <Nav profile={profile} />
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-brand-border">
        <Link
          href={`/pools/${bracket.pool_id}`}
          className="text-brand-muted hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black truncate">{bracket.name}</h1>
          <p className="text-brand-muted text-xs">{pool?.name}</p>
        </div>
        {bracket.is_submitted && (
          <span className="text-xs font-semibold text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full">
            ✓ Submitted
          </span>
        )}
        <div className="text-right">
          <div className="text-2xl font-black text-brand-orange">{bracket.score}</div>
          <div className="text-xs text-brand-muted">pts</div>
        </div>
      </div>

      <div className="flex-1">
        <BracketPicker
          bracketId={bracket.id}
          poolId={bracket.pool_id}
          initialPicks={bracket.picks as Record<string, string> || {}}
          isSubmitted={bracket.is_submitted || !isOwner}
          teams={teams}
        />
      </div>
    </div>
  )
}
