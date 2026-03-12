'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface LiveScoreProps {
  bracketId: string
  initialScore: number
}

export default function LiveScore({ bracketId, initialScore }: LiveScoreProps) {
  const [score, setScore] = useState(initialScore)
  const [pulse, setPulse] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`bracket-score-${bracketId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'brackets',
          filter: `id=eq.${bracketId}`,
        },
        (payload) => {
          const newScore = (payload.new as any).score
          setScore((prev: number) => {
            if (newScore !== prev) {
              setPulse(true)
              setTimeout(() => setPulse(false), 1000)
            }
            return newScore
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bracketId, supabase])

  return (
    <div className={`transition-all ${pulse ? 'scale-110' : 'scale-100'}`}>
      <span
        className={`text-4xl font-black transition-colors ${
          pulse ? 'text-brand-gold' : 'text-brand-orange'
        }`}
      >
        {score}
      </span>
      {pulse && (
        <span className="text-xs text-green-400 ml-2 animate-fade-in">+pts!</span>
      )}
    </div>
  )
}
