import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import Nav from '@/components/layout/Nav'
import dynamic from 'next/dynamic'
import ShareButton from '@/components/bracket/ShareButton'
import PostBracketInviteBanner from '@/components/pools/PostBracketInviteBanner'

// Lazy-load the heavy bracket picker — it's large JS and only needed client-side
const BracketPicker = dynamic(() => import('@/components/bracket/BracketPicker'), {
  loading: () => (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <div className="text-brand-muted animate-pulse text-sm">Loading bracket…</div>
    </div>
  ),
  ssr: false,
})
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
    espnId: t.espn_id || undefined,
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

  // Get pool info
  const { data: poolRaw } = await supabase
    .from('pools')
    .select('name, status, id, invite_code')
    .eq('id', bracket.pool_id)
    .maybeSingle()

  // Get member count for invite banner
  const { count: memberCount } = await supabase
    .from('pool_members')
    .select('id', { count: 'exact', head: true })
    .eq('pool_id', bracket.pool_id)

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

  // Load all games: need region/round/game_number for UUID→slug mapping, results for pick coloring
  const { data: completedGames } = await supabase
    .from('games')
    .select('id, region, round, game_number, winner_id, team1_id, team2_id, team1_score, team2_score, status')

  // Build UUID → slug mapping matching BracketPicker's gameId() formula
  // BracketPicker uses within-region position-based game numbers, NOT absolute DB game_numbers
  const REGION_ORDER: Record<string, number> = { East: 0, West: 1, South: 2, Midwest: 3 }
  const GAMES_PER_REGION = [8, 4, 2, 1] // R1-R4 games per region

  // Hardcoded slug map for R3-R6 — DB region data is unreliable for R4+ seeded games
  const SPECIAL_SLUGS: Record<number, string> = {
    // R3 Sweet 16 (game_numbers 49-56, alternating East/West/South/Midwest)
    49: 'east-r3-g1',  50: 'west-r3-g3',  51: 'south-r3-g5',  52: 'midwest-r3-g7',
    53: 'east-r3-g2',  54: 'west-r3-g4',  55: 'south-r3-g6',  56: 'midwest-r3-g8',
    // R4 Elite 8
    57: 'east-r4-g1',  58: 'west-r4-g2',  59: 'south-r4-g3',  60: 'midwest-r4-g4',
    // R5 Final Four
    61: 'ff-r5-g1', 62: 'ff-r5-g2',
    // R6 Championship
    63: 'championship-r6-g1',
  }

  // Group games by round+region to find within-region position
  type GameRow = { id: string; region: string; round: number; game_number: number; winner_id: string | null; team1_id: string | null; team2_id: string | null; team1_score: number | null; team2_score: number | null; status: string }
  const byRoundRegion: Record<string, GameRow[]> = {}
  for (const g of completedGames || []) {
    const key = `${g.round}-${g.region}`
    ;(byRoundRegion[key] = byRoundRegion[key] || []).push(g)
  }
  for (const arr of Object.values(byRoundRegion)) arr.sort((a, b) => a.game_number - b.game_number)

  const gameIdMap = new Map<string, string>() // UUID → slug
  for (const g of completedGames || []) {
    const special = SPECIAL_SLUGS[g.game_number]
    if (special) { gameIdMap.set(g.id, special); continue }
    if (g.round <= 4) {
      const regionIdx = REGION_ORDER[g.region] ?? 0
      const group = byRoundRegion[`${g.round}-${g.region}`] || []
      const withinIdx = group.findIndex(x => x.id === g.id)
      const bracketNum = regionIdx * GAMES_PER_REGION[g.round - 1] + withinIdx + 1
      gameIdMap.set(g.id, `${g.region.toLowerCase()}-r${g.round}-g${bracketNum}`)
    } else {
      // fallback for any unmapped round
      gameIdMap.set(g.id, `${g.region.toLowerCase()}-r${g.round}-g${g.game_number}`)
    }
  }

  const gameResults: Record<string, { winnerId: string; team1Score?: number; team2Score?: number }> = {}
  for (const g of completedGames || []) {
    if (g.winner_id) {
      const slug = gameIdMap.get(g.id) || g.id
      gameResults[slug] = { winnerId: g.winner_id, team1Score: g.team1_score ?? undefined, team2Score: g.team2_score ?? undefined }
    }
  }

  // Try to load teams from DB; fall back to mock data
  const { data: dbTeams } = await supabase.from('teams').select('*').eq('is_active', true)
  const teams: BracketTeam[] = dbTeams && dbTeams.length >= 64
    ? dbTeams.map(teamToPickerTeam)
    : MOCK_TEAMS

  const isOwner = bracket.user_id === session.user.id
  const pool = poolRaw as { name: string; status: string; id: string; invite_code: string } | null

  const userName = profile?.display_name || 'Anonymous'
  const poolStatus = pool?.status || 'open'

  // Translate picks from UUID game keys → slug keys using the same corrected gameIdMap
  const rawPicks = (bracket.picks as Record<string, string>) || {}
  const picks: Record<string, string> = {}
  for (const [key, val] of Object.entries(rawPicks)) {
    const slug = gameIdMap.get(key)
    picks[slug ?? key] = val // use corrected slug if found, else keep as-is (handles already-slug picks)
  }

  // DEBUG: log r3 picks and gameResults
  const r3picks = Object.entries(picks).filter(([k]) => k.includes('r3'))
  const r3results = Object.entries(gameResults).filter(([k]) => k.includes('r3'))
  console.log('[bracket-debug] totalGames:', completedGames?.length, 'totalPicks:', Object.keys(picks).length)
  console.log('[bracket-debug] r3picks:', JSON.stringify(r3picks))
  console.log('[bracket-debug] r3results:', JSON.stringify(r3results))
  console.log('[bracket-debug] game49slug:', completedGames?.find(g => g.game_number === 49) ? gameIdMap.get(completedGames.find(g => g.game_number === 49)!.id) : 'n/a')

  // Determine champion pick from picks (game 63 = championship in full bracket)

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
          gameResults={gameResults}
          poolName={pool?.name || 'UFSL Pool'}
          score={bracket.score || 0}
        />
      </div>

      {/* Post-bracket invite prompt — only for owner's unsubmitted bracket */}
      {isOwner && !bracket.is_submitted && pool?.invite_code && (
        <PostBracketInviteBanner
          poolId={pool.id}
          poolName={pool.name}
          inviteCode={pool.invite_code}
          inviteUrl={`${process.env.NEXT_PUBLIC_SITE_URL || ''}/join/${pool.invite_code}`}
          inviterName={userName}
          memberCount={memberCount || 0}
        />
      )}
    </div>
  )
}
