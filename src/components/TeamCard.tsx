'use client'

import { useEffect, useRef } from 'react'
import { X, TrendingUp, TrendingDown, Users, Clock, Award, BarChart2, Percent } from 'lucide-react'
import clsx from 'clsx'
import type { BracketTeam } from '@/lib/bracket'
import TeamLogo from '@/components/ui/TeamLogo'
import { getTeamDetail, type TeamDetail, type RecentGame } from '@/data/teamDetails'
import { getTeamPrediction, getSeedMatchupStat, SEED_MATCHUP_STATS } from '@/lib/predictions'

// ─────────────────────────────────────────────────────────────────
// TeamCard Props
// ─────────────────────────────────────────────────────────────────
interface TeamCardProps {
  team: BracketTeam | null
  onClose: () => void
}

export default function TeamCard({ team, onClose }: TeamCardProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Lock body scroll while open
  useEffect(() => {
    if (team) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [team])

  if (!team) return null

  const detail = getTeamDetail(
    team.id,
    team.name,
    team.abbreviation,
    team.seed,
    team.region,
    team.primaryColor
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel — slides in from the right */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${detail.name} team details`}
        className={clsx(
          'fixed right-0 top-0 bottom-0 z-50',
          'w-full sm:w-[420px] max-h-screen overflow-y-auto',
          'bg-brand-surface border-l border-brand-border',
          'shadow-2xl animate-slide-in-right',
          'flex flex-col'
        )}
      >
        <TeamCardContent detail={detail} team={team} onClose={onClose} />
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// Main content
// ─────────────────────────────────────────────────────────────────
function TeamCardContent({ detail, team, onClose }: { detail: TeamDetail; team: BracketTeam | null; onClose: () => void }) {
  const seedPct = Math.round(detail.seedHistory.winPctRound1 * 100)
  const hasStats = detail.stats.ppg > 0
  const hasPlayers = detail.keyPlayers.length > 0
  const hasGames = detail.recentGames.length > 0
  const prediction = getTeamPrediction(detail.teamId)

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Header ─────────────────────────────── */}
      <div
        className="relative px-5 pt-6 pb-5 flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, ${detail.primaryColor}30 0%, transparent 70%)`,
          borderBottom: `2px solid ${detail.primaryColor}40`,
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-brand-muted hover:text-white hover:bg-brand-card transition-colors"
          aria-label="Close team card"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4 pr-8">
          {/* Team logo */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden"
            style={{ backgroundColor: detail.primaryColor + '30' }}
          >
            <TeamLogo espnId={team?.espnId} teamName={detail.name} size="lg" />
          </div>

          <div className="min-w-0">
            <h2 className="text-xl font-black text-white leading-tight truncate">{detail.name}</h2>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
              <span className="text-sm text-brand-muted">{detail.region} Region</span>
              <span className="text-brand-border">·</span>
              <span className="text-sm text-brand-muted">{detail.conference}</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <SeedBadge seed={detail.seed} />
              <span className="text-white font-bold text-lg">{detail.record}</span>
              {detail.record !== '—' && (
                <RecordBar record={detail.record} />
              )}
            </div>
          </div>
        </div>

        {detail.conferenceTournResult && (
          <div className="mt-3 flex items-center gap-2 text-xs text-brand-muted">
            <Award size={12} className="text-brand-gold flex-shrink-0" />
            <span>{detail.conferenceTournResult}</span>
          </div>
        )}
      </div>

      {/* ── Scrollable body ─────────────────────── */}
      <div className="flex-1 overflow-y-auto divide-y divide-brand-border/50">

        {/* Win Probability */}
        {prediction && (
          <section className="px-5 py-4">
            <SectionTitle icon={<Percent size={14} />}>Win Probability</SectionTitle>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-brand-muted">Round 1 win probability</span>
                <span className="text-xs text-brand-muted">via {prediction.source}</span>
              </div>
              <div className="relative h-8 rounded-xl overflow-hidden bg-brand-card border border-brand-border">
                <div
                  className="absolute left-0 top-0 bottom-0 flex items-center justify-center transition-all duration-700"
                  style={{
                    width: `${prediction.winProbability}%`,
                    background: prediction.winProbability >= 70
                      ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                      : prediction.winProbability >= 50
                      ? 'linear-gradient(90deg, #ca8a04, #eab308)'
                      : 'linear-gradient(90deg, #dc2626, #ef4444)',
                  }}
                >
                  <span className="text-white font-black text-sm drop-shadow">
                    {prediction.winProbability}%
                  </span>
                </div>
              </div>
              {prediction.rating && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-muted">Efficiency Rating</span>
                  <span className="font-bold text-white">{prediction.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Key Stats */}
        {hasStats ? (
          <section className="px-5 py-4">
            <SectionTitle icon={<BarChart2 size={14} />}>Key Stats</SectionTitle>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <StatCard
                label="Points / Game"
                value={detail.stats.ppg.toFixed(1)}
                sub="Offense"
                accent="orange"
                icon={<TrendingUp size={14} />}
              />
              <StatCard
                label="Pts Allowed / Game"
                value={detail.stats.papg.toFixed(1)}
                sub="Defense"
                accent="blue"
                icon={<TrendingDown size={14} />}
              />
              {detail.stats.sosRank > 0 && (
                <StatCard
                  label="Strength of Schedule"
                  value={`#${detail.stats.sosRank}`}
                  sub="National rank"
                  accent="muted"
                />
              )}
              {detail.stats.netRanking && (
                <StatCard
                  label="NET Ranking"
                  value={`#${detail.stats.netRanking}`}
                  sub="Selection metric"
                  accent="gold"
                />
              )}
              {detail.stats.kenpomRanking && (
                <StatCard
                  label="KenPom"
                  value={`#${detail.stats.kenpomRanking}`}
                  sub="Efficiency rank"
                  accent="muted"
                />
              )}
              {detail.stats.fieldGoalPct && (
                <StatCard
                  label="FG%"
                  value={`${detail.stats.fieldGoalPct.toFixed(1)}%`}
                  sub="Field goal pct"
                  accent="muted"
                />
              )}
              {detail.stats.threePointPct && (
                <StatCard
                  label="3PT%"
                  value={`${detail.stats.threePointPct.toFixed(1)}%`}
                  sub="Three-point pct"
                  accent="muted"
                />
              )}
              {detail.stats.reboundsPerGame && (
                <StatCard
                  label="Rebounds / Game"
                  value={detail.stats.reboundsPerGame.toFixed(1)}
                  sub="Team rebounds"
                  accent="muted"
                />
              )}
            </div>
          </section>
        ) : (
          <PlaceholderSection title="Key Stats" icon={<BarChart2 size={14} />} />
        )}

        {/* Recent Performance */}
        <section className="px-5 py-4">
          <SectionTitle icon={<Clock size={14} />}>
            Recent Performance
            {hasGames && <span className="text-brand-muted font-normal ml-1.5">(last {detail.recentGames.length})</span>}
          </SectionTitle>
          {hasGames ? (
            <div className="mt-3 space-y-1.5">
              {detail.recentGames.map((game, i) => (
                <GameRow key={i} game={game} />
              ))}
            </div>
          ) : (
            <EmptyNote>Game results will be added before Selection Sunday.</EmptyNote>
          )}
        </section>

        {/* Key Players */}
        <section className="px-5 py-4">
          <SectionTitle icon={<Users size={14} />}>Key Players</SectionTitle>
          {hasPlayers ? (
            <div className="mt-3 space-y-2">
              {detail.keyPlayers.map((player, i) => (
                <PlayerRow key={i} player={player} rank={i + 1} />
              ))}
            </div>
          ) : (
            <EmptyNote>Player data will be added before Selection Sunday.</EmptyNote>
          )}
        </section>

        {/* Historical Seed Performance */}
        <section className="px-5 py-4 pb-8">
          <SectionTitle icon={<Award size={14} />}>Seed #{detail.seed} History</SectionTitle>
          <div className="mt-3 space-y-3">
            {/* Win % bar */}
            <div>
              <div className="flex justify-between text-xs text-brand-muted mb-1">
                <span>First Round Win %</span>
                <span className="text-white font-semibold">{seedPct}%</span>
              </div>
              <div className="h-2 bg-brand-card rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${seedPct}%`,
                    background: seedPct >= 75 ? '#22c55e' : seedPct >= 50 ? '#F97316' : seedPct >= 30 ? '#EAB308' : '#ef4444',
                  }}
                />
              </div>
            </div>

            {/* All-time record */}
            <div className="flex items-center justify-between bg-brand-card rounded-lg px-3 py-2.5">
              <span className="text-xs text-brand-muted">All-Time Tourney Record</span>
              <span className="text-sm font-bold text-white">{detail.seedHistory.allTimeTournRecord}</span>
            </div>

            {/* Best finish */}
            <div className="flex items-center justify-between bg-brand-card rounded-lg px-3 py-2.5">
              <span className="text-xs text-brand-muted">Best Finish</span>
              <span className="text-sm font-bold text-brand-gold">{detail.seedHistory.bestFinish}</span>
            </div>

            {/* Upset note */}
            {detail.seedHistory.upsetNote && (
              <div className="bg-brand-orange/10 border border-brand-orange/20 rounded-lg px-3 py-2.5">
                <p className="text-xs text-brand-muted leading-relaxed">
                  <span className="text-brand-orange font-semibold">📊 </span>
                  {detail.seedHistory.upsetNote}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────

function SectionTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-bold text-brand-muted uppercase tracking-widest">
      {icon && <span className="text-brand-orange">{icon}</span>}
      {children}
    </h3>
  )
}

function SeedBadge({ seed }: { seed: number }) {
  const isTopSeed = seed <= 3
  const isMidSeed = seed <= 8
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black',
        isTopSeed
          ? 'bg-brand-gradient text-white'
          : isMidSeed
          ? 'bg-brand-card text-white border border-brand-border'
          : 'bg-brand-card text-brand-muted border border-brand-border'
      )}
    >
      {seed}
    </span>
  )
}

function RecordBar({ record }: { record: string }) {
  const parts = record.split('-')
  const wins = parseInt(parts[0]) || 0
  const losses = parseInt(parts[1]) || 0
  const total = wins + losses
  if (total === 0) return null
  const winPct = wins / total

  return (
    <div className="flex items-center gap-1">
      <div className="h-1.5 w-16 bg-brand-card rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full"
          style={{ width: `${winPct * 100}%` }}
        />
      </div>
      <span className="text-[10px] text-brand-muted">{Math.round(winPct * 100)}%</span>
    </div>
  )
}

type AccentColor = 'orange' | 'gold' | 'blue' | 'muted'

function StatCard({
  label,
  value,
  sub,
  accent = 'muted',
  icon,
}: {
  label: string
  value: string
  sub: string
  accent?: AccentColor
  icon?: React.ReactNode
}) {
  const valueColor: Record<AccentColor, string> = {
    orange: 'text-brand-orange',
    gold: 'text-brand-gold',
    blue: 'text-blue-400',
    muted: 'text-white',
  }

  return (
    <div className="bg-brand-card rounded-xl p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-brand-muted">
        {icon && <span>{icon}</span>}
        <span className="text-[10px] font-semibold uppercase tracking-wide truncate">{label}</span>
      </div>
      <span className={clsx('text-2xl font-black leading-none', valueColor[accent])}>{value}</span>
      <span className="text-[10px] text-brand-muted">{sub}</span>
    </div>
  )
}

function GameRow({ game }: { game: RecentGame }) {
  const isWin = game.result === 'W'
  return (
    <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-brand-card/50 transition-colors">
      <span
        className={clsx(
          'w-6 h-6 rounded-md text-xs font-black flex items-center justify-center flex-shrink-0',
          isWin ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        )}
      >
        {game.result}
      </span>
      <span className="text-xs text-white flex-1 truncate">{game.opponent}</span>
      <span className={clsx('text-xs font-semibold flex-shrink-0', isWin ? 'text-green-400' : 'text-red-400')}>
        {game.score}
      </span>
      {(game.isConferenceTournament || game.isTournament) && (
        <span className="text-[9px] text-brand-gold flex-shrink-0">
          {game.isTournament ? 'NCAA' : 'CONF'}
        </span>
      )}
      {game.date && (
        <span className="text-[10px] text-brand-muted flex-shrink-0 hidden sm:block">{game.date}</span>
      )}
    </div>
  )
}

function PlayerRow({ player, rank }: { player: { name: string; position: string; ppg: number; rpg: number; apg: number; jersey?: number }; rank: number }) {
  return (
    <div className="flex items-center gap-3 bg-brand-card rounded-xl px-3 py-2.5">
      <span className="text-lg font-black text-brand-border w-5 text-center flex-shrink-0">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white truncate">{player.name}</span>
          <span className="text-[10px] text-brand-muted bg-brand-border/30 px-1.5 py-0.5 rounded">{player.position}</span>
          {player.jersey !== undefined && (
            <span className="text-[10px] text-brand-muted">#{player.jersey}</span>
          )}
        </div>
        {player.ppg > 0 && (
          <div className="flex gap-3 mt-1">
            <StatPill label="PPG" value={player.ppg.toFixed(1)} accent />
            <StatPill label="RPG" value={player.rpg.toFixed(1)} />
            <StatPill label="APG" value={player.apg.toFixed(1)} />
          </div>
        )}
      </div>
    </div>
  )
}

function StatPill({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <span className="text-[10px] flex items-center gap-1">
      <span className="text-brand-muted">{label}</span>
      <span className={clsx('font-bold', accent ? 'text-brand-orange' : 'text-white')}>{value}</span>
    </span>
  )
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 text-xs text-brand-muted italic">{children}</p>
  )
}

function PlaceholderSection({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <section className="px-5 py-4">
      <SectionTitle icon={icon}>{title}</SectionTitle>
      <EmptyNote>Stats will be added before Selection Sunday.</EmptyNote>
    </section>
  )
}
