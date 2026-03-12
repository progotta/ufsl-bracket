import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import Nav from '@/components/layout/Nav'
import BracketPicker from '@/components/bracket/BracketPicker'
import ShareButton from '@/components/bracket/ShareButton'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MOCK_TEAMS } from '@/lib/bracket'
import type { BracketTeam } from '@/lib/bracket'
import type { Bracket, Team } from '@/types/database'

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createServerClient()
  const { data: bracketRaw } = await supabase
    .from('brackets')
    .select('id, name, score, user_id, pool_id, picks')
    .eq('id', params.bracketId)
    .maybeSingle()

  if (!bracketRaw) {
    return { title: 'Bracket — UFSL' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', bracketRaw.user_id)
    .maybeSingle()

  const { data: pool } = await supabase
    .from('pools')
    .select('name, status')
    .eq('id', bracketRaw.pool_id)
    .maybeSingle()

  const userName = profile?.display_name || 'Anonymous'
  const poolName = pool?.name || 'UFSL Pool'
  const score = bracketRaw.score || 0
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ufsl.net'
  const status = pool?.status === 'active' ? 'active' : 'pre'

  const imageUrl = `${siteUrl}/api/bracket/${params.bracketId}/image?name=${encodeURIComponent(userName)}&pool=${encodeURIComponent(poolName)}&score=${score}&status=${status}`
  const title = `${userName}'s Bracket — ${poolName}`
  const description = `${userName} has ${score} points in ${poolName}. Can you beat them? Join the UFSL Bracket Challenge!`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: `${userName}'s UFSL bracket` }],
      siteName: 'UFSL Bracket Challenge',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
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

  // Fetch bracket separately to avoid join typing issues
  const { data: bracketRaw } = await supabase
    .from('brackets')
    .select('id, pool_id, user_id, name, picks, is_submitted, score, max_possible_score')
    .eq('id', params.bracketId)
    .maybeSingle()

  if (!bracketRaw) redirect('/dashboard')
  
  const bracket = bracketRaw as Bracket

  // Get pool name
  const { data: poolRaw } = await supabase
    .from('pools')
    .select('name, status, id')
    .eq('id', bracket.pool_id)
    .maybeSingle()

  // Only the owner or pool members can view
  if (bracket.user_id !== session.user.id) {
    const { data: membership } = await supabase
      .from('pool_members')
      .select('id')
      .eq('pool_id', bracket.pool_id)
      .eq('user_id', session.user.id)
      .maybeSingle()
    if (!membership) redirect('/dashboard')
  }

  // Try to load teams from DB; fall back to mock data
  const { data: dbTeams } = await supabase.from('teams').select('*').eq('is_active', true)
  const teams: BracketTeam[] = dbTeams && dbTeams.length >= 64
    ? dbTeams.map(teamToPickerTeam)
    : MOCK_TEAMS

  const isOwner = bracket.user_id === session.user.id
  const pool = poolRaw as { name: string; status: string; id: string } | null

  const userName = profile?.display_name || 'Anonymous'
  const poolStatus = pool?.status || 'open'

  // Determine champion pick from picks (game 63 = championship in full bracket)
  const picks = (bracket.picks as Record<string, string>) || {}
  const championTeamId = picks['game-63'] || picks['championship'] || null
  const championTeam = championTeamId
    ? teams.find(t => t.id === championTeamId)
    : null

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
          <p className="text-brand-muted text-xs">{pool?.name || 'Pool'}</p>
        </div>
        {bracket.is_submitted && (
          <span className="text-xs font-semibold text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full">
            ✓ Submitted
          </span>
        )}
        {/* Share button in toolbar */}
        <ShareButton
          bracketId={bracket.id}
          userName={userName}
          poolName={pool?.name || 'UFSL Pool'}
          score={bracket.score || 0}
          poolStatus={poolStatus}
          champion={championTeam?.name}
          className="btn-secondary flex items-center gap-2 text-sm"
        />
        <div className="text-right">
          <div className="text-2xl font-black text-brand-orange">{bracket.score}</div>
          <div className="text-xs text-brand-muted">pts</div>
        </div>
      </div>

      <div className="flex-1">
        <BracketPicker
          bracketId={bracket.id}
          poolId={bracket.pool_id}
          initialPicks={picks}
          isSubmitted={bracket.is_submitted || !isOwner}
          teams={teams}
          userName={userName}
          poolName={pool?.name || 'UFSL Pool'}
          score={bracket.score || 0}
        />
      </div>
    </div>
  )
}
