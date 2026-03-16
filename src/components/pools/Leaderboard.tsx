import type { LeaderboardEntry } from '@/types/database'
import { Trophy } from 'lucide-react'
import PlayerAvatar from '@/components/ui/PlayerAvatar'

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId: string
  poolStatus: string
}

export default function Leaderboard({ entries, currentUserId, poolStatus }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <section>
        <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
        <div className="bg-brand-surface border border-dashed border-brand-border rounded-2xl p-8 text-center">
          <Trophy size={36} className="text-brand-muted mx-auto mb-3" />
          <p className="text-brand-muted text-sm">
            No brackets submitted yet. Be the first!
          </p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Leaderboard</h2>
        {poolStatus === 'open' && (
          <span className="text-xs text-brand-muted bg-brand-card px-3 py-1 rounded-full border border-brand-border">
            Scores hidden until lock
          </span>
        )}
      </div>
      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 border-b border-brand-border text-xs font-semibold text-brand-muted uppercase tracking-wide">
          <span>Rank</span>
          <span>Player</span>
          <span className="text-right">Max</span>
          <span className="text-right">Score</span>
        </div>

        {entries.map((entry, idx) => {
          const isMe = entry.user_id === currentUserId
          const rankEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null

          return (
            <div
              key={entry.bracket_id}
              className={`grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-5 py-4 ${
                idx > 0 ? 'border-t border-brand-border' : ''
              } ${isMe ? 'bg-brand-orange/5' : 'hover:bg-brand-card/50'} transition-colors`}
            >
              {/* Rank */}
              <div className="w-8 text-center">
                {rankEmoji ? (
                  <span className="text-xl">{rankEmoji}</span>
                ) : (
                  <span className="text-brand-muted font-mono text-sm">#{entry.rank}</span>
                )}
              </div>

              {/* Player */}
              <div className="flex items-center gap-3 min-w-0">
                <PlayerAvatar
                  userId={entry.user_id}
                  displayName={entry.display_name}
                  avatarUrl={entry.avatar_url}
                  size="w-8 h-8"
                  borderClass={isMe ? 'border-brand-orange' : 'border-brand-border/40'}
                />
                <div className="min-w-0">
                  <div className={`font-semibold text-sm truncate ${isMe ? 'text-brand-orange' : ''}`}>
                    {entry.display_name || 'Anonymous'}
                    {isMe && <span className="text-xs ml-1.5 text-brand-muted">(you)</span>}
                  </div>
                  <div className="text-xs text-brand-muted truncate">{entry.bracket_name}</div>
                </div>
              </div>

              {/* Max possible */}
              <div className="text-right">
                <div className="text-sm text-brand-muted">{entry.max_possible_score}</div>
              </div>

              {/* Score */}
              <div className="text-right">
                <div className={`text-xl font-black ${isMe ? 'text-brand-orange' : 'text-white'}`}>
                  {entry.score}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
