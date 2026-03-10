'use client'

import { useState } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import { ROUND_NAMES } from '@/lib/bracket'

interface GameTeam {
  id: string
  name: string
  abbreviation: string
  seed: number
  region: string
}

interface Game {
  id: string
  round: number
  game_number: number
  region: string | null
  status: string
  team1: GameTeam | null
  team2: GameTeam | null
  winner: GameTeam | null
  team1_score: number | null
  team2_score: number | null
}

interface GameResultsFormProps {
  games: Game[]
}

export default function GameResultsForm({ games }: GameResultsFormProps) {
  const [updating, setUpdating] = useState<string | null>(null)
  const [updated, setUpdated] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const roundGroups: Record<number, Game[]> = {}
  games.forEach(g => {
    if (!roundGroups[g.round]) roundGroups[g.round] = []
    roundGroups[g.round].push(g)
  })

  const handleSetWinner = async (game: Game, winnerId: string, t1Score?: number, t2Score?: number) => {
    setUpdating(game.id)
    setError(null)

    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          winnerId,
          team1Score: t1Score,
          team2Score: t2Score,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update')
      } else {
        setUpdated(prev => [...prev, game.id])
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setUpdating(null)
    }
  }

  if (games.length === 0) {
    return (
      <div className="bg-brand-surface border border-dashed border-brand-border rounded-2xl p-10 text-center">
        <p className="text-brand-muted">No games found. Add teams and games in Supabase first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>
      )}

      {Object.entries(roundGroups).map(([round, roundGames]) => (
        <div key={round}>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="bg-brand-orange text-white text-xs px-2 py-0.5 rounded-full font-bold">
              R{round}
            </span>
            {ROUND_NAMES[parseInt(round)]}
          </h2>
          <div className="space-y-2">
            {roundGames.map(game => (
              <GameRow
                key={game.id}
                game={game}
                isUpdating={updating === game.id}
                isUpdated={updated.includes(game.id)}
                onSetWinner={handleSetWinner}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function GameRow({
  game,
  isUpdating,
  isUpdated,
  onSetWinner,
}: {
  game: Game
  isUpdating: boolean
  isUpdated: boolean
  onSetWinner: (game: Game, winnerId: string) => void
}) {
  if (!game.team1 || !game.team2) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-xl p-4 text-brand-muted text-sm">
        Game {game.game_number} — Teams TBD
      </div>
    )
  }

  const isCompleted = game.status === 'completed' || game.winner

  return (
    <div className={`bg-brand-surface border rounded-xl p-4 flex items-center gap-4 ${
      isCompleted ? 'border-brand-border opacity-70' : 'border-brand-border hover:border-brand-orange/30'
    }`}>
      <div className="text-xs text-brand-muted w-16 flex-shrink-0">
        G{game.game_number}
        {game.region && <span className="block">{game.region.substring(0, 4)}</span>}
      </div>

      {/* Team 1 */}
      <button
        onClick={() => !isCompleted && onSetWinner(game, game.team1!.id)}
        disabled={isCompleted || isUpdating}
        className={`flex items-center gap-2 flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          game.winner?.id === game.team1.id
            ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/30'
            : isCompleted
            ? 'bg-brand-card/30 text-brand-muted'
            : 'bg-brand-card hover:bg-brand-orange/10 hover:text-brand-orange'
        }`}
      >
        <span className="text-xs bg-brand-border px-1.5 py-0.5 rounded font-mono">{game.team1.seed}</span>
        <span className="truncate">{game.team1.abbreviation}</span>
        {game.winner?.id === game.team1.id && <CheckCircle size={14} className="text-brand-orange ml-auto flex-shrink-0" />}
      </button>

      <span className="text-brand-muted text-xs">vs</span>

      {/* Team 2 */}
      <button
        onClick={() => !isCompleted && onSetWinner(game, game.team2!.id)}
        disabled={isCompleted || isUpdating}
        className={`flex items-center gap-2 flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          game.winner?.id === game.team2.id
            ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/30'
            : isCompleted
            ? 'bg-brand-card/30 text-brand-muted'
            : 'bg-brand-card hover:bg-brand-orange/10 hover:text-brand-orange'
        }`}
      >
        <span className="text-xs bg-brand-border px-1.5 py-0.5 rounded font-mono">{game.team2.seed}</span>
        <span className="truncate">{game.team2.abbreviation}</span>
        {game.winner?.id === game.team2.id && <CheckCircle size={14} className="text-brand-orange ml-auto flex-shrink-0" />}
      </button>

      <div className="w-8 flex-shrink-0 flex items-center justify-center">
        {isUpdating ? (
          <Loader2 size={16} className="animate-spin text-brand-orange" />
        ) : isUpdated ? (
          <CheckCircle size={16} className="text-green-400" />
        ) : isCompleted ? (
          <span className="text-green-400 text-xs">✓</span>
        ) : null}
      </div>
    </div>
  )
}
