'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NotificationPrompt from '@/components/NotificationPrompt'
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
import { BRACKET_TYPE_META, getRoundsForBracketType } from '@/lib/secondChance'
import {
  generateQuickFillPicks,
  countPickChanges,
  FILL_STRATEGY_META,
  type FillStrategy,
} from '@/lib/quickFill'
import { Save, CheckCircle, Loader2, ZoomIn, ZoomOut, RotateCcw, Info, BarChart2, Shuffle, Zap, Trophy, TrendingDown, Trash2, Undo2, ChevronDown, X, Download, Share2 } from 'lucide-react'
import { useLiveScores } from '@/hooks/useLiveScores'
import GameLiveScore from '@/components/bracket/GameLiveScore'
import type { LiveGameScore } from '@/lib/liveScores'
import { createContext, useContext } from 'react'

// Context to pass live score map and user picks down without prop drilling
const LiveScoreContext = createContext<{
  liveScoreMap: Map<string, LiveGameScore>
  picks: Record<string, string>
}>({ liveScoreMap: new Map(), picks: {} })
import clsx from 'clsx'
import TeamCard from '@/components/TeamCard'
import MatchupInsights from '@/components/predictions/MatchupInsights'
import BracketImportModal from '@/components/bracket/BracketImportModal'
import ShareModal from '@/components/ShareModal'
import { getTeamPrediction } from '@/lib/predictions'

interface BracketPickerProps {
  bracketId: string
  poolId: string
  initialPicks?: Record<string, string>
  isSubmitted?: boolean
  teams?: BracketTeam[]
  bracketType?: 'full' | 'fresh32' | 'sweet16' | 'elite8' | 'final4'
  userName?: string
  poolName?: string
  score?: number
}

export default function BracketPicker({
  bracketId,
  poolId,
  initialPicks = {},
  isSubmitted = false,
  teams = MOCK_TEAMS,
  bracketType = 'full',
  userName = 'Anonymous',
  poolName = 'UFSL Pool',
  score = 0,
}: BracketPickerProps) {
  const [picks, setPicks] = useState<Record<string, string>>(initialPicks)
  const [undoPicks, setUndoPicks] = useState<Record<string, string> | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showSharePrompt, setShowSharePrompt] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [activeRegion, setActiveRegion] = useState<Region | 'All' | 'Final Four'>('All')
  const [selectedTeam, setSelectedTeam] = useState<BracketTeam | null>(null)
  const [showInsights, setShowInsights] = useState(false)
  const [showQuickFillMenu, setShowQuickFillMenu] = useState(false)
  const [pendingFill, setPendingFill] = useState<{ strategy: FillStrategy; newPicks: Record<string, string> } | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const baseGames = useMemo(() => buildBracketStructure(teams), [teams])
  const resolvedGames = useMemo(() => resolveBracket(baseGames, picks, teams), [baseGames, picks, teams])

  const gameMap = useMemo(
    () => new Map(resolvedGames.map(g => [g.id, g])),
    [resolvedGames]
  )

  const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams])

  // Live scores — fetch and map by team-pair key for fast bracket lookup
  const { games: liveGames } = useLiveScores()
  const liveScoreMap = useMemo(() => {
    const map = new Map<string, LiveGameScore>()
    for (const lg of liveGames) {
      if (lg.status === 'scheduled') continue
      // Key by sorted team ID pair so lookup is order-independent
      if (lg.team1.id && lg.team2.id) {
        const key = [lg.team1.id, lg.team2.id].sort().join('|')
        map.set(key, lg)
      }
    }
    return map
  }, [liveGames])

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

  const handleTeamInfo = useCallback((team: BracketTeam) => {
    setSelectedTeam(team)
  }, [])

  const handleQuickFill = useCallback(
    (strategy: FillStrategy | 'clear') => {
      setShowQuickFillMenu(false)
      if (isSubmitted) return
      if (strategy === 'clear') {
        setPendingFill({ strategy: 'chaos', newPicks: {} })
      } else {
        const newPicks = generateQuickFillPicks(baseGames, teams, strategy)
        setPendingFill({ strategy, newPicks })
      }
    },
    [isSubmitted, baseGames, teams]
  )

  const confirmQuickFill = useCallback(() => {
    if (!pendingFill) return
    setUndoPicks(picks)
    setPicks(pendingFill.newPicks)
    setSaved(false)
    setPendingFill(null)
  }, [pendingFill, picks])

  const cancelQuickFill = useCallback(() => {
    setPendingFill(null)
  }, [])

  const handleUndo = useCallback(() => {
    if (!undoPicks) return
    setPicks(undoPicks)
    setUndoPicks(null)
    setSaved(false)
  }, [undoPicks])

  // Filter games by bracket type (fresh32 only shows round 2+, etc.)
  const allowedRounds = useMemo(() => getRoundsForBracketType(bracketType), [bracketType])
  const bracketTypeMeta = BRACKET_TYPE_META[bracketType]

  const completedPicks = Object.keys(picks).filter(gameId => {
    const game = resolvedGames.find(g => g.id === gameId)
    return game && allowedRounds.includes(game.round)
  }).length
  const totalGames = bracketTypeMeta.picks

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
        // Show share prompt before redirecting
        setShowSharePrompt(true)
        setSubmitting(false)
        setSaving(false)
        return
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    }

    setSaving(false)
    setSubmitting(false)
  }

  const handleReset = () => {
    setPendingFill({ strategy: 'chaos', newPicks: {} })
  }

  const handleImportApply = useCallback((importedPicks: Record<string, string>) => {
    setUndoPicks(picks)
    setPicks(prev => ({ ...prev, ...importedPicks }))
    setSaved(false)
  }, [picks])

  const isClear = pendingFill?.newPicks !== undefined && Object.keys(pendingFill.newPicks).length === 0
  const pendingMeta = pendingFill && !isClear ? FILL_STRATEGY_META[pendingFill.strategy] : null
  const fillChanges = pendingFill
    ? countPickChanges(picks, pendingFill.newPicks)
    : null

  return (
    <div className="flex flex-col h-full">
      {/* Team info card drawer */}
      <TeamCard team={selectedTeam} onClose={() => setSelectedTeam(null)} />

      {/* Bracket Import Modal */}
      {showImportModal && (
        <BracketImportModal
          onClose={() => setShowImportModal(false)}
          onApply={handleImportApply}
          teams={teams}
        />
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        bracketId={bracketId}
        userName={userName}
        poolName={poolName}
        score={score}
        poolStatus="open"
        champion={(() => {
          const champId = picks['game-63'] || picks['championship']
          return champId ? teams.find(t => t.id === champId)?.name : undefined
        })()}
      />

      {/* Post-submit share prompt */}
      {showSharePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
          <div className="relative z-10 bg-brand-surface border border-brand-border rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 text-center">
            <div className="text-5xl mb-4">🏀</div>
            <h2 className="text-2xl font-black mb-2">Bracket Submitted!</h2>
            <p className="text-brand-muted mb-6">
              Your picks are locked in. Brag to your friends and challenge them to beat you!
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowSharePrompt(false)
                  setShowShareModal(true)
                }}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <Share2 size={16} />
                Share My Bracket
              </button>
              <button
                onClick={() => router.push(`/pools/${poolId}`)}
                className="btn-secondary"
              >
                View Pool Leaderboard
              </button>
              <NotificationPrompt trigger="after_bracket" className="text-left" />
            </div>
          </div>
        </div>
      )}

      {/* Quick-fill confirmation modal */}
      {pendingFill && (
        <QuickFillModal
          isClear={isClear}
          meta={pendingMeta}
          changes={fillChanges}
          onConfirm={confirmQuickFill}
          onCancel={cancelQuickFill}
        />
      )}

      {/* Toolbar */}
      <div className="sticky top-0 z-20 bg-brand-dark/90 backdrop-blur-xl border-b border-brand-border py-3 px-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {/* Bracket type badge */}
            {bracketType !== 'full' && (
              <div className={`hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${bracketTypeMeta.accentBg} border ${bracketTypeMeta.accentBorder} ${bracketTypeMeta.accentText}`}>
                <span>{bracketTypeMeta.emoji}</span>
                <span>{bracketTypeMeta.badge}</span>
              </div>
            )}
            {/* Region filter */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {(['All', ...REGIONS, 'Final Four'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setActiveRegion(r as Region | 'All' | 'Final Four')}
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

          <div className="flex items-center gap-3 flex-wrap">
            {/* Progress */}
            <div className="text-sm text-brand-muted hidden sm:block">
              <span className="text-white font-bold">{completedPicks}</span>/{totalGames} picks
            </div>

            {/* Import Bracket button */}
            {!isSubmitted && (
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border bg-brand-card border-brand-border text-brand-muted hover:text-white hover:border-brand-orange/50"
                title="Import bracket from ESPN, Yahoo, CBS, or NCAA screenshot"
              >
                <Download size={12} />
                <span className="hidden sm:inline">Import</span>
              </button>
            )}

            {/* Quick-fill dropdown */}
            {!isSubmitted && (
              <div className="relative">
                <button
                  onClick={() => setShowQuickFillMenu(m => !m)}
                  className={clsx(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                    showQuickFillMenu
                      ? 'bg-brand-orange/20 border-brand-orange/40 text-brand-orange'
                      : 'bg-brand-card border-brand-border text-brand-muted hover:text-white'
                  )}
                  title="Quick-fill your bracket"
                >
                  <Shuffle size={12} />
                  <span className="hidden sm:inline">Quick Fill</span>
                  <ChevronDown size={11} className={clsx('transition-transform', showQuickFillMenu && 'rotate-180')} />
                </button>

                {showQuickFillMenu && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-30" onClick={() => setShowQuickFillMenu(false)} />
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-1 z-40 bg-brand-card border border-brand-border rounded-xl shadow-xl min-w-[220px] overflow-hidden">
                      <div className="px-3 py-2 border-b border-brand-border">
                        <p className="text-xs font-bold text-brand-muted uppercase tracking-wide">Quick Fill</p>
                      </div>
                      {(Object.entries(FILL_STRATEGY_META) as [FillStrategy, typeof FILL_STRATEGY_META[FillStrategy]][]).map(
                        ([strategy, meta]) => (
                          <button
                            key={strategy}
                            onClick={() => handleQuickFill(strategy)}
                            className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-brand-dark/60 transition-colors text-left group"
                          >
                            <span className="text-lg leading-none mt-0.5">{meta.emoji}</span>
                            <div>
                              <div className="text-sm font-semibold text-white group-hover:text-brand-orange transition-colors">
                                {meta.label}
                              </div>
                              <div className="text-xs text-brand-muted leading-snug">{meta.description}</div>
                            </div>
                          </button>
                        )
                      )}
                      <div className="border-t border-brand-border">
                        <button
                          onClick={() => handleQuickFill('clear')}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-950/40 transition-colors text-left group"
                        >
                          <Trash2 size={16} className="text-red-400 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-semibold text-red-400">Clear All</div>
                            <div className="text-xs text-brand-muted">Reset bracket to empty</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Undo button — appears after quick-fill */}
            {!isSubmitted && undoPicks !== null && (
              <button
                onClick={handleUndo}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-card border border-brand-border text-brand-muted hover:text-white transition-all"
                title="Undo quick-fill"
              >
                <Undo2 size={12} />
                <span className="hidden sm:inline">Undo</span>
              </button>
            )}

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

            {/* Insights toggle */}
            <button
              onClick={() => setShowInsights(s => !s)}
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                showInsights
                  ? 'bg-brand-orange/20 border-brand-orange/40 text-brand-orange'
                  : 'bg-brand-card border-brand-border text-brand-muted hover:text-white'
              )}
              title="Toggle matchup insights (odds, win%, crowd picks)"
            >
              <BarChart2 size={12} />
              <span className="hidden sm:inline">Insights</span>
            </button>

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
              <>
                <span className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                  <CheckCircle size={16} />
                  Submitted
                </span>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="btn-secondary text-sm flex items-center gap-2 py-2"
                >
                  <Share2 size={14} />
                  Share
                </button>
              </>
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
        <LiveScoreContext.Provider value={{ liveScoreMap, picks }}>
          <div
            className="transition-transform origin-top-left"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          >
            {activeRegion === 'All' ? (
              <FullBracket
                gameMap={gameMap}
                picks={picks}
                onPick={handlePick}
                onTeamInfo={handleTeamInfo}
                isSubmitted={isSubmitted}
                showInsights={showInsights}
              />
            ) : (
              <RegionBracket
                region={activeRegion as string}
                gameMap={gameMap}
                picks={picks}
                onPick={handlePick}
                onTeamInfo={handleTeamInfo}
                isSubmitted={isSubmitted}
                showInsights={showInsights}
              />
            )}
          </div>
        </LiveScoreContext.Provider>
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
  onTeamInfo,
  isSubmitted,
  showInsights,
}: {
  gameMap: Map<string, BracketGame>
  picks: Record<string, string>
  onPick: (gameId: string, teamId: string) => void
  onTeamInfo: (team: BracketTeam) => void
  isSubmitted: boolean
  showInsights: boolean
}) {
  return (
    <div className="min-w-[1200px]">
      {/* Top half: East (left), West (right) */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 mb-4">
        <RegionColumn region="East" side="left" gameMap={gameMap} picks={picks} onPick={onPick} onTeamInfo={onTeamInfo} isSubmitted={isSubmitted} showInsights={showInsights} />
        <FinalFourColumn gameMap={gameMap} picks={picks} onPick={onPick} onTeamInfo={onTeamInfo} isSubmitted={isSubmitted} showInsights={showInsights} />
        <RegionColumn region="West" side="right" gameMap={gameMap} picks={picks} onPick={onPick} onTeamInfo={onTeamInfo} isSubmitted={isSubmitted} showInsights={showInsights} />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 mt-4">
        <RegionColumn region="South" side="left" gameMap={gameMap} picks={picks} onPick={onPick} onTeamInfo={onTeamInfo} isSubmitted={isSubmitted} showInsights={showInsights} />
        <div /> {/* spacer */}
        <RegionColumn region="Midwest" side="right" gameMap={gameMap} picks={picks} onPick={onPick} onTeamInfo={onTeamInfo} isSubmitted={isSubmitted} showInsights={showInsights} />
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
  onTeamInfo,
  isSubmitted,
  showInsights,
}: {
  region: Region
  side: 'left' | 'right'
  gameMap: Map<string, BracketGame>
  picks: Record<string, string>
  onPick: (gameId: string, teamId: string) => void
  onTeamInfo: (team: BracketTeam) => void
  isSubmitted: boolean
  showInsights: boolean
}) {
  const rounds = side === 'left' ? [1, 2, 3, 4] : [4, 3, 2, 1]

  return (
    <div className={`flex gap-1 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
      {rounds.map(round => (
        <div key={round} className={clsx('flex flex-col justify-around gap-2', showInsights && round === 1 ? 'min-w-[180px]' : 'min-w-[160px]')}>
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
            onTeamInfo={onTeamInfo}
            isSubmitted={isSubmitted}
            showInsights={showInsights}
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
  onTeamInfo,
  isSubmitted,
  showInsights,
}: {
  region: Region
  round: number
  side: 'left' | 'right'
  gameMap: Map<string, BracketGame>
  picks: Record<string, string>
  onPick: (gameId: string, teamId: string) => void
  onTeamInfo: (team: BracketTeam) => void
  isSubmitted: boolean
  showInsights: boolean
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
          onTeamInfo={onTeamInfo}
          isSubmitted={isSubmitted}
          side={side}
          showInsights={showInsights}
        />
      ))}
    </div>
  )
}

function FinalFourColumn({
  gameMap,
  picks,
  onPick,
  onTeamInfo,
  isSubmitted,
  showInsights,
}: {
  gameMap: Map<string, BracketGame>
  picks: Record<string, string>
  onPick: (gameId: string, teamId: string) => void
  onTeamInfo: (team: BracketTeam) => void
  isSubmitted: boolean
  showInsights: boolean
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
          <GameSlot game={ff1} picks={picks} onPick={onPick} onTeamInfo={onTeamInfo} isSubmitted={isSubmitted} side="center" showInsights={showInsights} />
        )}
      </div>

      <div className="text-center">
        <div className="text-xs font-bold text-brand-orange uppercase tracking-wide mb-2">
          🏆 Championship
        </div>
        {championship && (
          <GameSlot game={championship} picks={picks} onPick={onPick} onTeamInfo={onTeamInfo} isSubmitted={isSubmitted} side="center" highlight showInsights={showInsights} />
        )}
      </div>

      <div className="text-center">
        {ff2 && (
          <GameSlot game={ff2} picks={picks} onPick={onPick} onTeamInfo={onTeamInfo} isSubmitted={isSubmitted} side="center" showInsights={showInsights} />
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
  onTeamInfo,
  isSubmitted,
  showInsights,
}: {
  region: string
  gameMap: Map<string, BracketGame>
  picks: Record<string, string>
  onPick: (gameId: string, teamId: string) => void
  onTeamInfo: (team: BracketTeam) => void
  isSubmitted: boolean
  showInsights: boolean
}) {
  if (region === 'Final Four') {
    const ff1 = gameMap.get('ff-r5-g1')
    const ff2 = gameMap.get('ff-r5-g2')
    const championship = gameMap.get('championship-r6-g1')
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <SectionHeader title="Final Four" />
        {ff1 && <GameSlot game={ff1} picks={picks} onPick={onPick} onTeamInfo={onTeamInfo} isSubmitted={isSubmitted} side="center" wide showInsights={showInsights} />}
        {ff2 && <GameSlot game={ff2} picks={picks} onPick={onPick} onTeamInfo={onTeamInfo} isSubmitted={isSubmitted} side="center" wide showInsights={showInsights} />}
        <SectionHeader title="🏆 Championship" />
        {championship && <GameSlot game={championship} picks={picks} onPick={onPick} onTeamInfo={onTeamInfo} isSubmitted={isSubmitted} side="center" highlight wide showInsights={showInsights} />}
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
                  onTeamInfo={onTeamInfo}
                  isSubmitted={isSubmitted}
                  side="center"
                  wide
                  showInsights={showInsights}
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
  onTeamInfo,
  isSubmitted,
  side,
  highlight = false,
  wide = false,
  showInsights = false,
}: {
  game: BracketGame
  picks: Record<string, string>
  onPick: (gameId: string, teamId: string) => void
  onTeamInfo: (team: BracketTeam) => void
  isSubmitted: boolean
  side: 'left' | 'right' | 'center'
  highlight?: boolean
  wide?: boolean
  showInsights?: boolean
}) {
  const pickedTeamId = picks[game.id]
  const bothTeamsKnown = !!game.team1 && !!game.team2
    && !game.team1.id.startsWith('placeholder') && !game.team2.id.startsWith('placeholder')
  const hasPredictions = bothTeamsKnown && showInsights && !!getTeamPrediction(game.team1!.id)

  // Live score lookup via context
  const { liveScoreMap } = useContext(LiveScoreContext)
  const liveScore = bothTeamsKnown
    ? liveScoreMap.get([game.team1!.id, game.team2!.id].sort().join('|'))
    : undefined
  const hasLiveScore = !!liveScore && liveScore.status !== 'scheduled'

  return (
    <div
      className={clsx(
        'rounded-xl border overflow-hidden transition-all',
        hasLiveScore && (liveScore!.status === 'in_progress' || liveScore!.status === 'halftime')
          ? liveScore!.isClose
            ? 'border-brand-gold/50 shadow-sm shadow-brand-gold/10'
            : 'border-red-500/30'
          : highlight
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
        onInfo={() => game.team1 && onTeamInfo(game.team1)}
        disabled={isSubmitted || !game.team1}
        isTop
      />
      <div className="h-px bg-brand-border" />
      <TeamSlot
        team={game.team2}
        isPicked={pickedTeamId === game.team2?.id}
        isWinnerSlot={highlight}
        onClick={() => game.team2 && onPick(game.id, game.team2.id)}
        onInfo={() => game.team2 && onTeamInfo(game.team2)}
        disabled={isSubmitted || !game.team2}
        isTop={false}
      />
      {/* Live score inline display */}
      {hasLiveScore && (
        <>
          <div className="h-px bg-brand-border/50" />
          <div className="px-2 py-1.5 bg-brand-dark/80">
            <GameLiveScore
              game={liveScore!}
              userPickTeamId={pickedTeamId}
              variant="compact"
            />
          </div>
        </>
      )}
      {/* Inline matchup insights (compact) */}
      {hasPredictions && (
        <>
          <div className="h-px bg-brand-border/50" />
          <div className="bg-brand-dark/60">
            <MatchupInsights
              team1={game.team1!}
              team2={game.team2!}
              gameId={game.id}
              compact
            />
          </div>
        </>
      )}
    </div>
  )
}

function TeamSlot({
  team,
  isPicked,
  isWinnerSlot,
  onClick,
  onInfo,
  disabled,
  isTop,
}: {
  team?: BracketTeam
  isPicked: boolean
  isWinnerSlot: boolean
  onClick: () => void
  onInfo: () => void
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
    <div
      className={clsx(
        'group team-slot w-full flex items-center gap-2 px-2 py-2 min-h-[36px] transition-all',
        isPicked
          ? isWinnerSlot
            ? 'bg-brand-gold/20 winner-glow'
            : 'bg-brand-orange/20'
          : 'bg-brand-card/50 hover:bg-brand-card',
        disabled && !isPicked && 'opacity-60'
      )}
    >
      {/* Seed badge — click to open team card */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onInfo() }}
        className={clsx(
          'w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center flex-shrink-0 transition-all',
          'hover:scale-110 hover:ring-1 hover:ring-brand-orange/60',
          isPicked ? 'bg-brand-orange text-white' : 'bg-brand-border text-brand-muted'
        )}
        title={`View ${team.name} details`}
        aria-label={`View ${team.name} team info`}
      >
        {team.seed}
      </button>

      {/* Team name — click to pick */}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={clsx(
          'text-xs font-semibold truncate flex-1 text-left',
          isPicked ? (isWinnerSlot ? 'text-brand-gold' : 'text-brand-orange') : 'text-white',
          !disabled && 'cursor-pointer',
          disabled && !isPicked && 'cursor-default'
        )}
      >
        {team.abbreviation}
      </button>

      {/* Info icon — visible on hover */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onInfo() }}
        className={clsx(
          'flex-shrink-0 text-brand-muted transition-all',
          'opacity-0 group-hover:opacity-100',
          'hover:text-brand-orange'
        )}
        title={`View ${team.name} details`}
        aria-label={`View ${team.name} team info`}
      >
        <Info size={11} />
      </button>

      {/* Pick indicator */}
      {isPicked && (
        <span className="text-brand-orange flex-shrink-0">
          <CheckCircle size={12} />
        </span>
      )}
    </div>
  )
}

// ============================================
// Quick-fill confirmation modal
// ============================================
function QuickFillModal({
  isClear,
  meta,
  changes,
  onConfirm,
  onCancel,
}: {
  isClear: boolean
  meta: typeof FILL_STRATEGY_META[FillStrategy] | null
  changes: { changed: number; total: number } | null
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-brand-card border border-brand-border rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            {isClear ? (
              <div className="w-10 h-10 rounded-xl bg-red-900/40 border border-red-700/40 flex items-center justify-center">
                <Trash2 size={18} className="text-red-400" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/30 flex items-center justify-center text-xl">
                {meta?.emoji}
              </div>
            )}
            <div>
              <h2 className="text-base font-bold text-white">
                {isClear ? 'Clear All Picks?' : `${meta?.label}?`}
              </h2>
              <p className="text-xs text-brand-muted">
                {isClear ? 'Reset your bracket to empty' : meta?.description}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-brand-muted hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Warning / preview */}
        <div className="px-5 pb-4">
          {changes && changes.changed > 0 ? (
            <div className={clsx(
              'rounded-lg px-4 py-3 text-sm',
              isClear
                ? 'bg-red-950/40 border border-red-700/30 text-red-300'
                : 'bg-brand-orange/10 border border-brand-orange/20 text-brand-orange'
            )}>
              {isClear
                ? `This will clear all ${changes.changed} of your picks.`
                : `This will update ${changes.changed} of your ${changes.total} picks.`}
            </div>
          ) : changes && changes.changed === 0 ? (
            <div className="rounded-lg px-4 py-3 text-sm bg-brand-dark border border-brand-border text-brand-muted">
              No changes — your picks already match this strategy.
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-dark border border-brand-border text-brand-muted hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={clsx(
              'flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
              isClear
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-brand-orange hover:bg-brand-orange/90 text-white'
            )}
          >
            {isClear ? 'Clear All' : `Apply ${meta?.label}`}
          </button>
        </div>
      </div>
    </div>
  )
}
