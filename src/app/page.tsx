import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import { Trophy, Users, Zap, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-court-gradient">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-orange/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-gold/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        {/* Court lines decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white rounded-full" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white" />
        </div>
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <Logo size="sm" />
        <Link href="/auth" className="btn-primary text-sm">
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-orange/10 border border-brand-orange/20 rounded-full px-4 py-1.5 text-sm text-brand-orange mb-6">
          <span className="w-2 h-2 bg-brand-orange rounded-full animate-pulse" />
          2026 NCAA Tournament — Mar 19 – Apr 6
        </div>

        <h1 className="text-5xl sm:text-7xl font-black leading-tight mb-6">
          <span className="text-white">Your bracket.</span>
          <br />
          <span className="bg-brand-gradient bg-clip-text text-transparent">
            Your glory.
          </span>
        </h1>

        <p className="text-xl text-brand-muted max-w-2xl mx-auto mb-10">
          Fill out your NCAA Tournament bracket, compete against your crew in a 
          private pool, and watch the chaos unfold.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth" className="btn-primary flex items-center justify-center gap-2 text-lg py-4 px-8">
            Create Your Bracket
            <ArrowRight size={20} />
          </Link>
          <Link href="/auth" className="btn-secondary flex items-center justify-center gap-2 text-lg py-4 px-8">
            Join a Pool
          </Link>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-16">
          <Stat value="64" label="Teams" />
          <div className="w-px h-8 bg-brand-border" />
          <Stat value="63" label="Games" />
          <div className="w-px h-8 bg-brand-border" />
          <Stat value="192" label="Max Points" />
          <div className="w-px h-8 bg-brand-border" />
          <Stat value="∞" label="Bragging Rights" />
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Trophy className="text-brand-orange" size={28} />}
            title="Pick Your Bracket"
            desc="Fill out all 63 games with our slick bracket picker. Visual, fast, and built for the madness."
          />
          <FeatureCard
            icon={<Users className="text-brand-gold" size={28} />}
            title="Private Pools"
            desc="Create a pool and share an invite link. Up to however many friends you want — the more the merrier."
          />
          <FeatureCard
            icon={<Zap className="text-green-400" size={28} />}
            title="Live Scoring"
            desc="Scores update automatically as games are played. Watch your bracket live or die in real time."
          />
        </div>
      </section>

      {/* Scoring explanation */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Standard Scoring</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { round: 'Round of 64', pts: 1 },
              { round: 'Round of 32', pts: 2 },
              { round: 'Sweet 16', pts: 4 },
              { round: 'Elite 8', pts: 8 },
              { round: 'Final Four', pts: 16 },
              { round: 'Championship', pts: 32 },
            ].map(({ round, pts }) => (
              <div key={round} className="bg-brand-card rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-brand-orange">{pts}</div>
                <div className="text-sm text-brand-muted mt-1">{round}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-brand-border py-8 text-center text-brand-muted text-sm">
        <p>UFSL Bracket Challenge • <a href="https://ufsl.net" className="hover:text-white transition-colors">UFSL.net</a></p>
      </footer>
    </main>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-black bg-brand-gradient bg-clip-text text-transparent">{value}</div>
      <div className="text-brand-muted text-sm">{label}</div>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 hover:border-brand-orange/40 transition-colors">
      <div className="bg-brand-card rounded-xl w-12 h-12 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-brand-muted text-sm leading-relaxed">{desc}</p>
    </div>
  )
}
