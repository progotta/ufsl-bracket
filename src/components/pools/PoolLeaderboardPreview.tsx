'use client'

interface LeaderboardEntry {
  userId: string
  displayName: string
  score: number
  rank: number
}

interface Props {
  entries: LeaderboardEntry[]
  currentUserId: string
  currentUserRank?: number
  currentUserScore?: number
  totalMembers: number
  tournamentStarted: boolean
}

export default function PoolLeaderboardPreview({
  entries,
  currentUserId,
  currentUserRank,
  currentUserScore,
  totalMembers,
  tournamentStarted,
}: Props) {
  if (!tournamentStarted || entries.length === 0) {
    return (
      <div className="text-xs text-brand-muted mt-1.5">
        👥 {totalMembers} member{totalMembers !== 1 ? 's' : ''} · Picks due Mar 19
      </div>
    )
  }

  const userInTop3 = entries.some(e => e.userId === currentUserId)

  return (
    <div className="mt-2 space-y-0.5">
      {entries.map((entry) => {
        const isMe = entry.userId === currentUserId
        return (
          <div
            key={entry.userId}
            className={`flex items-center justify-between text-xs rounded px-1 py-0.5 ${
              isMe ? 'bg-brand-orange/10 text-brand-orange font-semibold' : 'text-brand-muted'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-4 text-right opacity-60">{entry.rank}.</span>
              <span className="truncate max-w-[110px]">{isMe ? 'You' : entry.displayName}</span>
            </span>
            <span className="font-mono">{entry.score}pts</span>
          </div>
        )
      })}
      {!userInTop3 && currentUserRank != null && (
        <div className="flex items-center justify-between text-xs rounded px-1 py-0.5 bg-brand-orange/10 text-brand-orange font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="w-4 text-right opacity-60">→</span>
            <span>You</span>
          </span>
          <span className="font-mono">#{currentUserRank} · {currentUserScore ?? 0}pts</span>
        </div>
      )}
    </div>
  )
}
