'use client'
import { useState } from 'react'
import { Share2, Copy, Check } from 'lucide-react'

interface LeaderboardEntry {
  display_name: string
  score: number
  rank: number
}

interface Props {
  poolName: string
  poolUrl: string
  leaderboard: LeaderboardEntry[]
}

export default function ShareStandingsCard({ poolName, poolUrl, leaderboard }: Props) {
  const [copied, setCopied] = useState(false)

  const top3 = leaderboard.slice(0, 3)
  const medals = ['🥇', '🥈', '🥉']

  const shareText = top3.length > 0
    ? `${poolName} standings:\n${top3.map((e, i) => `${medals[i]} ${e.display_name} — ${e.score} pts`).join('\n')}\nWatch the chaos: ${poolUrl}`
    : `Check out the ${poolName} bracket pool: ${poolUrl}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: `${poolName} Standings`, text: shareText, url: poolUrl })
    } else {
      handleCopy()
    }
  }

  return (
    <div className="bg-brand-surface border border-brand-orange/30 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-brand-orange/10 rounded-xl p-2.5">
          <Share2 size={22} className="text-brand-orange" />
        </div>
        <div>
          <div className="font-bold">Share Standings</div>
          <div className="text-xs text-brand-muted">Brag. Trash talk. Invite spectators.</div>
        </div>
      </div>

      {/* Standings preview */}
      {top3.length > 0 && (
        <div className="bg-brand-dark rounded-xl p-3 mb-4 space-y-2">
          {top3.map((entry, i) => (
            <div key={entry.rank} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span>{medals[i]}</span>
                <span className="font-medium">{entry.display_name}</span>
              </span>
              <span className="text-brand-orange font-bold">{entry.score} pts</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleNativeShare}
          className="flex-1 flex items-center justify-center gap-2 bg-brand-orange text-white font-bold py-2.5 rounded-xl hover:bg-brand-orange/90 transition-colors text-sm"
        >
          <Share2 size={15} />
          Share
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 bg-brand-surface border border-brand-border px-4 py-2.5 rounded-xl hover:bg-brand-card transition-colors text-sm font-medium"
        >
          {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
