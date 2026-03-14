import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, Globe } from 'lucide-react'
import Leaderboard from '@/components/Leaderboard'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export default async function LeaderboardPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth')

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-brand-gold/10 rounded-xl p-3">
          <Globe size={24} className="text-brand-gold" />
        </div>
        <div>
          <h1 className="text-3xl font-black">Leaderboards</h1>
          <p className="text-brand-muted text-sm mt-0.5">
            2026 NCAA Tournament — Global Rankings
          </p>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-brand-gold/10 to-brand-orange/10 border border-brand-gold/20 rounded-2xl p-5 flex items-center gap-4">
        <span className="text-4xl">🏆</span>
        <div>
          <div className="font-bold text-brand-gold">Top 100 Rankings</div>
          <div className="text-sm text-brand-muted mt-0.5">
            Compete with players across every UFSL pool. Click any player to view their bracket.
          </div>
        </div>
      </div>

      {/* Leaderboard — defaults to global tab, shows all tabs */}
      <ErrorBoundary>
        <Leaderboard
          currentUserId={session.user.id}
          defaultTab="global"
          showTabs={true}
        />
      </ErrorBoundary>
    </div>
  )
}
