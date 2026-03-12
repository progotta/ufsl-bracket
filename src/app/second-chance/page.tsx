import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight, Clock, Zap, Trophy, RefreshCw } from 'lucide-react'
import {
  BRACKET_TYPE_META,
  BRACKET_TYPE_ORDER,
  isBracketTypeOpen,
  type BracketType,
} from '@/lib/secondChance'
import type { Game } from '@/types/database'

export const metadata = {
  title: 'Second Chance Brackets | UFSL',
  description: 'Bracket busted? Start fresh! Join a new bracket after every round.',
}

export default async function SecondChancePage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Fetch games to determine which bracket types are open
  const { data: gamesRaw } = await supabase
    .from('games')
    .select('id, round, status, team1_id, team2_id, winner_id, scheduled_at')
    .order('round', { ascending: true })

  const games = (gamesRaw || []) as Game[]

  // Determine open/available bracket types
  const openTypes = BRACKET_TYPE_ORDER.filter(type => isBracketTypeOpen(type, games))
  const hasOpenTypes = openTypes.length > 0

  return (
    <div className="max-w-4xl mx-auto space-y-12">

      {/* Hero */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-semibold px-4 py-1.5 rounded-full">
          <RefreshCw size={14} />
          Home of the 2nd Chance Bracket!
        </div>
        <h1 className="text-4xl sm:text-5xl font-black leading-tight">
          Bracket Busted?{' '}
          <span className="bg-brand-gradient bg-clip-text text-transparent">
            Start Fresh.
          </span>
        </h1>
        <p className="text-xl text-brand-muted max-w-2xl mx-auto">
          It&apos;s never too late to win. After every round, we open new brackets with only
          the surviving teams. Jump in. Pick winners. Win.
        </p>
        {hasOpenTypes && (
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {openTypes.map(type => (
              <Link
                key={type}
                href={session ? `/pools/new?bracket_type=${type}` : '/auth'}
                className="btn-primary flex items-center gap-2"
              >
                {BRACKET_TYPE_META[type].emoji}
                Start {BRACKET_TYPE_META[type].shortLabel}
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* How It Works */}
      <section>
        <h2 className="text-2xl font-black mb-6 text-center">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">💥</div>
            <h3 className="font-bold mb-2">Round Ends</h3>
            <p className="text-sm text-brand-muted">A round completes, teams get eliminated, and we open a new bracket type.</p>
          </div>
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold mb-2">You Jump In</h3>
            <p className="text-sm text-brand-muted">Fill out your fresh bracket in minutes. Only pick from the surviving teams.</p>
          </div>
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="font-bold mb-2">You Win</h3>
            <p className="text-sm text-brand-muted">Compete in a pool, climb the leaderboard, and claim bragging rights.</p>
          </div>
        </div>
      </section>

      {/* Bracket Types Grid */}
      <section>
        <h2 className="text-2xl font-black mb-6">All Bracket Types</h2>
        <div className="space-y-4">
          {BRACKET_TYPE_ORDER.map(type => {
            const meta = BRACKET_TYPE_META[type]
            const isOpen = isBracketTypeOpen(type, games)
            const isPast = !isOpen && type !== 'full'

            return (
              <BracketTypeCard
                key={type}
                type={type}
                isOpen={isOpen}
                isPast={isPast}
                isAuthenticated={!!session}
              />
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-brand-orange/10 to-brand-gold/10 border border-brand-orange/20 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-black mb-2">Ready to Jump In?</h2>
        <p className="text-brand-muted mb-6">
          {session
            ? 'Create a pool or join an existing one — your second chance awaits.'
            : 'Sign in to start picking. It takes 30 seconds.'}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {session ? (
            <>
              <Link href="/pools/new" className="btn-primary flex items-center gap-2">
                <Trophy size={16} />
                Create a Pool
              </Link>
              <Link href="/pools" className="btn-secondary flex items-center gap-2">
                Browse Pools
                <ArrowRight size={16} />
              </Link>
            </>
          ) : (
            <Link href="/auth" className="btn-primary flex items-center gap-2">
              Sign In to Get Started
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </section>

      {/* Marketing quotes */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { quote: 'It\'s Never Too Late to Win', sub: 'Jump in any round' },
          { quote: 'Fill Out in 2 Minutes', sub: 'Fewer picks, faster fun' },
          { quote: 'Fresh Start Every Round', sub: 'Upsets don\'t matter here' },
          { quote: 'One Bracket. Or Five.', sub: 'Stack your chances' },
        ].map(({ quote, sub }) => (
          <div
            key={quote}
            className="bg-brand-card border border-brand-border rounded-xl p-5 flex items-center gap-4"
          >
            <div className="text-2xl">🎯</div>
            <div>
              <div className="font-bold">{quote}</div>
              <div className="text-sm text-brand-muted">{sub}</div>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

function BracketTypeCard({
  type,
  isOpen,
  isPast,
  isAuthenticated,
}: {
  type: BracketType
  isOpen: boolean
  isPast: boolean
  isAuthenticated: boolean
}) {
  const meta = BRACKET_TYPE_META[type]

  return (
    <div
      className={`
        relative bg-brand-surface rounded-2xl border p-6 transition-all
        ${isOpen
          ? `${meta.accentBorder} hover:scale-[1.01]`
          : 'border-brand-border opacity-60'
        }
      `}
    >
      {/* Status badge */}
      <div className="absolute top-4 right-4">
        {isOpen ? (
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${meta.accentBg} ${meta.accentBorder} border ${meta.accentText}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            OPEN NOW
          </span>
        ) : isPast ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-brand-card border border-brand-border text-brand-muted">
            <Clock size={10} />
            Closed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-brand-card border border-brand-border text-brand-muted">
            <Clock size={10} />
            Coming Soon
          </span>
        )}
      </div>

      <div className="flex items-start gap-5">
        {/* Emoji */}
        <div className={`text-4xl shrink-0 p-3 rounded-xl ${meta.accentBg}`}>
          {meta.emoji}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-black text-lg">{meta.label}</h3>
          </div>
          <p className="text-brand-muted text-sm mb-3">{meta.description}</p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 text-sm mb-4">
            <div className="flex items-center gap-1.5">
              <Zap size={13} className={meta.accentText} />
              <span className="font-semibold">{meta.picks} picks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy size={13} className={meta.accentText} />
              <span className="font-semibold">{meta.teams} teams</span>
            </div>
            <div className={`font-semibold italic ${meta.accentText}`}>
              {meta.tagline}
            </div>
          </div>

          {/* Headline */}
          <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">
            {meta.headline}
          </div>

          {/* CTA */}
          {isOpen && (
            <div className="flex gap-3">
              <Link
                href={isAuthenticated ? `/pools/new?bracket_type=${type}` : '/auth'}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                Create a Pool
                <ArrowRight size={14} />
              </Link>
              <Link
                href={isAuthenticated ? `/pools?bracket_type=${type}` : '/auth'}
                className="btn-secondary text-sm"
              >
                Browse Pools
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
