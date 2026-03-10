'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  buildBracketStructure,
  resolveBracket,
  MOCK_TEAMS,
  ROUND_NAMES,
  REGIONS,
  type BracketTeam,
  type BracketGame,
  type Region,
} from '@/lib/bracket'
import { Save, CheckCircle, Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import clsx from 'clsx'

interface BracketPickerProps {
  bracketId: string
  poolId: string
  initialPicks?: Record<string, string>
  isSubmitted?: boolean
  teams?: BracketTeam[]
}

export default function BracketPicker({
  bracketId,
  poolId,
  initialPicks = {},
  isSubmitted = false,
  teams = MOCK_TEAMS,
}: BracketPickerProps) {
  const [picks, setPicks] = useState<Record<string, string>>(initialPicks)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [activeRegion, setActiveRegion] = useState<Region | 'All'>('All')
  const router = useRouter()
  const supabase = createClient()

  const baseGames = useMemo(() => buildBracketStructure(teams), [teams])
  const resolvedGames = useMemo(() => resolveBracket(baseGames, picks, teams), [baseGames, picks, teams])

  const gameMap = useMemo(
    () => new Map(resolvedGames.map(g => [g.id, g])),
    [resolvedGames]
  )

  const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams])

  const handlePick = useCallback(
    (gameId: string, teamId: string) => {
      if (isSubmitted) return
      setPicks(prev => {
        const newPicks = { ...prev, [gameId]: teamId }
        // Clear downstream picks if they conflict
        // (when you change a pick, teams in later rounds may change)
        return newPicks
      })
      setSaved(false)
    },
    [isSubmitted]
  )

  const completedPicks = Object.keys(picks).length
  const totalGames = 63

  const handleSave = async (submit = false) => {
    if (submit) setSubmitting(true)
    else setSaving(true)

    const { error } = await supabase
      .from('brackets')
      .update({
        picks,
        is_submitted: submit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bracketId)

    if (!error) {
      if (submit) {
        router.push(`/pools/${poolId}`)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    }

    setSaving(false)
    setSubmitting(false)
  }

  const handleReset = () => {
    if (confirm('Reset all your picks? This cannot be undone.')) {
      setPicks({})
      setSaved(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 bg-brand-dark/90 backdrop-blur-xl border-b border-brand-border py-3 px-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {/* Region filter */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {(['All', ...REGIONS, 'Final Four'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setActiveRegion(r as Region | 'All')}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
                    activeRegion === r
                      ? 'bg-brand-orange text-white'
                      : 'text-brand-muted hover:text-white hover:bg-brand-card'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Progress */}
            <div className="text-sm text-brand-muted hidden sm:block">
              <span className="text-white font-bold">{completedPicks}</span>/{totalGames} picks
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-brand-card rounded-lg border border-brand-border">
              <button
                onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                className="p-1.5 hover:text-white text-brand-muted transition-colors"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-xs text-brand-muted px-1 min-w-[36px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
                className="p-1.5 hover:text-white text-brand-muted transition-colors"
              >
                <ZoomIn size={14} />
              </button>
            </div>

            {/* Reset */}
            {!isSubmitted && completedPicks > 0 && (
              <button
                onClick={handleReset}
                className="p-1.5 text-brand-muted hover:text-red-400 transition-colors"
                title="Reset picks"
              >
                <RotateCcw size={16} />
              </button>
            )}

            {/* Save */}
            {!isSubmitted && (
              <>
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="btn-secondary text-sm flex items-center gap-2 py-2"
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : saved ? (
                    <CheckCircle size={14} className="text-green-400" />
                  ) : (
                    <Save size={14} />
                  )}
                  {saved ? 'Saved!' : 'Save'}
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={submitting || completedPicks < totalGames}
                  className="btn-primary text-sm flex items-center gap-2 py-2"
                  title={completedPicks < totalGames ? `Complete all ${totalGames} picks first` : 'Submit bracket'}
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                  Submit ({completedPicks}/{totalGames})
                </button>
              </>
            )}
            {isSubmitted && (
              <span className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                <CheckCircle size={16} />
                Submitted
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-[1600px] mx-auto mt-2">
          <div className="h-1 bg-brand-border rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-gradient rounded-full transition-all duration-300"
              style={{ width: `${(completedPicks / totalGames) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bracket canvas */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div
          className="transition-transform origin-top-left"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        >
          {activeRegion === 'All' ? (
            <FullBracket
              gameMap={gameMap}
              picks={picks}
              onPick={handlePick}
              isSubmitted={isSubmitted}
            />
          ) : (
            <RegionBracket
              region={activeRegion === 'Final Four' ? 'Final Four' : activeRegion}
              gameMap={gameMap}
              picks={picks}
              onPick={handlePick}
              isSubmitted={isSubmitted}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Full bracket layout (desktop)
// ============================================
function FullBracket({
  gameMap,
  picks,
  onPick,
  isSubmitted,
}: {
  gameMap: Map<string, BracketGame>
  picks: Record<string, string>
  onPick: (gameId: string, teamId: string) => void
  isSubmitted: boolean
}) {
  return (
    <div className="min-w-[1200px]">
      {/* Top half: East (left), West (right) */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 mb-4">
        <RegionColumn region="East" side="left" gameMap={gameMap} picks={picks} onPick={onPick} isSubmitted={isSubmitted} />
        <FinalFourColumn gameMap={gameMap} picks={picks} onPick={onPick} isSubmitted={isSubmitted} />
        <RegionColumn region="West" side="right" gameMap={gameMap} picks={picks} onPick={onPick} isSubmitted={isSubmitted} />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 mt-4">
        <RegionColumn region="South" side="left" gameMap={gameMap} picks={picks} onPick={onPick} isSubmitted={isSubmitted} />
        <div /> {/* spacer */}
        <RegionColumn region="Midwest" side="right" gameMap={gameMap} picks={picks} onPick={onPick} isSubmitted={isSubmitted} />
      </div>
    </div>
  )
}

function RegionColumn({
  region,
  side,
  gameMap,
  picks,
  onPick,
  isSubmitted,
}: {
  region: Region
  side: 'left' | 'right'
  gameMap: Map<string, BracketGame>
  picks: Record<string, string>
  onPick: (gameId: string, teamId: string) => void
  isSubmitted: boolean
}) {
  const rounds = side === 'left' ? [1, 2, 3, 4] : [4, 3, 2, 1]

  return (
    <div className={`flex gap-1 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
      {rounds.map(round => (
        <div key={round} className="flex flex-col justify-around gap-2 min-w-[160px]">
          <div className="text-center text-xs font-bold text-brand-muted uppercase tracking-wide mb-1 px-1">
            {round === 1 ? region : ROUND_NAMES[round]}
          </div>
          <RoundGames
            region={region}
            round={round}
            side={side}
            gameMap={gameMap}
            picks={picks}
            onPick={onPick}
            isSubmitted={isSubmitted}
          />
        </div>
      ))}
    </div>
  )
}

function RoundGames({
  region,
  round,
  side,
  gameMap,
  picks,
  onPick,
  isSubmitted,
}: {
  region: Region
  round: number
  side: 'left' | 'right'
  gameMap: Map<string, BracketGame>
  picks: Record<string, string>
  onPick: (gameId: string, teamId: string) => void
  isSubmitted: boolean
}) {
  const games = Array.from(gameMap.values())
    .filter(g => g.region === region && g.round === round)
    .sort((a, b) => a.gameNumber - b.gameNumber)

  return (
    <div className="flex flex-col gap-2">
      {games.map(game => (
        <GameSlot
          key={game.id}
          game={game}
          picks={picks}
          onPick={onPick}
          isSubmitted={isSubmitted}
          side={side}
        />
      ))}
    </div>
  )
}

function FinalFourColumn({
  gameMap,
  picks,
  onPick,
  isSubmitted,
}: {
  gameMap: Map<string, BracketGame>
  picks: Record<string, string>
  onPick: (gameId: string, teamId: string) => void
  isSubmitted: boolean
}) {
  const ff1 = gameMap.get('ff-r5-g1')
  const ff2 = gameMap.get('ff-r5-g2')
  const championship = gameMap.get('championship-r6-g1')

  return (
    <div className="flex flex-col items-center justify-center gap-4 min-w-[180px] px-2">
      <div className="text-center">
        <div className="text-xs font-bold text-brand-gold uppercase tracking-wide mb-2">
          Final Four
        </div>
        {ff1 && (
          <GameSlot game={ff1} picks={picks} onPick={onPick} isSubmitted={isSubmitted} side="center" />
        )}
      </div>

      <div className="text-center">
        <div className="text-xs font-bold text-brand-orange uppercase tracking-wide mb-2">
          🏆 Championship
        </div>
        {championship && (
          <GameSlot game={championship} picks={picks} onPick={onPick} isSubmitted={isSubmitted} side="center" highlight />
        )}
      </div>

      <div className="text-center">
        {ff2 && (
          <GameSlot game={ff2} picks={picks} onPick={onPick} isSubmitted={isSubmitted} side="center" />
        )}
      </div>
    </div>
  )
}

// Single region bracket view
function RegionBracket({
  region,
  gameMap,
  picks,
  onPick,
  isSubmitted,
}: {
  region: string
  gameMap: Map<string, BracketGame>
  picks: Record<string, string>
  onPick: (gameId: string, teamId: string) => void
  isSubmitted: boolean
}) {
  if (region === 'Final Four') {
    const ff1 = gameMap.get('ff-r5-g1')
    const ff2 = gameMap.get('ff-r5-g2')
    const championship = gameMap.get('championship-r6-g1')
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <SectionHeader title="Final Four" />
        {ff1 && <GameSlot game={ff1} picks={picks} onPick={onPick} isSubmitted={isSubmitted} side="center" wide />}
        {ff2 && <GameSlot game={ff2} picks={picks} onPick={onPick} isSubmitted={isSubmitted} side="center" wide />}
        <SectionHeader title="🏆 Championship" />
        {championship && <GameSlot game={championship} picks={picks} onPick={onPick} isSubmitted={isSubmitted} side="center" highlight wide />}
      </div>
    )
  }

  const r = region as Region
  const rounds = [1, 2, 3, 4]

  return (
    <div className="space-y-8">
      <SectionHeader title={`${region} Region`} />
      {rounds.map(round => {
        const games = Array.from(gameMap.values())
          .filter(g => g.region === r && g.round === round)
          .sort((a, b) => a.gameNumber - b.gameNumber)

        return (
          <div key={round}>
            <div className="text-xs font-bold text-brand-muted uppercase tracking-wide mb-3">
              {ROUND_NAMES[round]}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {games.map(game => (
                <GameSlot
                  key={game.id}
                  game={game}
                  picks={picks}
                  onPick={onPick}
                  isSubmitted={isSubmitted}
                  side="center"
                  wide
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-xl font-black text-white">{title}</h2>
  )
}

// ============================================
// Game slot component
// ============================================
function GameSlot({
  game,
  picks,
  onPick,
  isSubmitted,
  side,
  highlight = false,
  wide = false,
}: {
  game: BracketGame
  picks: Record<string, string>
  onPick: (gameId: string, teamId: string) => void
  isSubmitted: boolean
  side: 'left' | 'right' | 'center'
  highlight?: boolean
  wide?: boolean
}) {
  const pickedTeamId = picks[game.id]

  return (
    <div
      className={clsx(
        'rounded-xl border overflow-hidden transition-all',
        highlight
          ? 'border-brand-gold/40 shadow-lg shadow-brand-gold/10'
          : 'border-brand-border',
        wide ? 'min-w-[240px]' : 'min-w-[150px] max-w-[190px]'
      )}
    >
      <TeamSlot
        team={game.team1}
        isPicked={pickedTeamId === game.team1?.id}
        isWinnerSlot={highlight}
        onClick={() => game.team1 && onPick(game.id, game.team1.id)}
        disabled={isSubmitted || !game.team1}
        isTop
      />
      <div className="h-px bg-brand-border" />
      <TeamSlot
        team={game.team2}
        isPicked={pickedTeamId === game.team2?.id}
        isWinnerSlot={highlight}
        onClick={() => game.team2 && onPick(game.id, game.team2.id)}
        disabled={isSubmitted || !game.team2}
        isTop={false}
      />
    </div>
  )
}

function TeamSlot({
  team,
  isPicked,
  isWinnerSlot,
  onClick,
  disabled,
  isTop,
}: {
  team?: BracketTeam
  isPicked: boolean
  isWinnerSlot: boolean
  onClick: () => void
  disabled: boolean
  isTop: boolean
}) {
  if (!team) {
    return (
      <div className="flex items-center gap-2 px-2 py-2 bg-brand-card/30 min-h-[36px]">
        <span className="w-5 h-5 rounded bg-brand-border/40 flex-shrink-0" />
        <span className="text-xs text-brand-muted/50 truncate">TBD</span>
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'team-slot w-full flex items-center gap-2 px-2 py-2 min-h-[36px] text-left transition-all',
        isPicked
          ? isWinnerSlot
            ? 'bg-brand-gold/20 winner-glow'
            : 'bg-brand-orange/20'
          : 'bg-brand-card/50 hover:bg-brand-card',
        disabled && !isPicked && 'opacity-60 cursor-default'
      )}
    >
      {/* Seed badge */}
      <span
        className={clsx(
          'w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center flex-shrink-0',
          isPicked ? 'bg-brand-orange text-white' : 'bg-brand-border text-brand-muted'
        )}
      >
        {team.seed}
      </span>

      {/* Team name */}
      <span
        className={clsx(
          'text-xs font-semibold truncate flex-1',
          isPicked ? (isWinnerSlot ? 'text-brand-gold' : 'text-brand-orange') : 'text-white'
        )}
      >
        {team.abbreviation}
      </span>

      {/* Pick indicator */}
      {isPicked && (
        <span className="text-brand-orange flex-shrink-0">
          <CheckCircle size={12} />
        </span>
      )}
    </button>
  )
}
