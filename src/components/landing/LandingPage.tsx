import Link from 'next/link'
import Logo from '@/components/ui/Logo'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-court-gradient text-white">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-orange/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-gold/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
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
      <section className="relative z-10 min-h-[80vh] flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="inline-flex items-center gap-2 bg-brand-orange/10 border border-brand-orange/30 rounded-full px-4 py-2 mb-8">
          <span className="text-brand-orange text-sm font-medium">Selection Sunday — March 16</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
          The last league platform<br />
          <span className="text-brand-orange">you&apos;ll ever need.</span>
        </h1>

        <p className="text-xl text-brand-muted max-w-2xl mb-6">
          Run any league. Any sport. Any pool.
          Automatic payments, real-time updates, and zero chasing —
          for commissioners who want to look like heroes and players who want to have fun.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Link
            href="/auth?mode=commissioner"
            className="bg-brand-orange text-white font-black text-lg px-8 py-4 rounded-2xl hover:bg-brand-orange/90 transition-colors text-center"
          >
            Start a Pool — Free
          </Link>
          <Link
            href="/auth"
            className="border border-brand-border text-white font-bold text-lg px-8 py-4 rounded-2xl hover:bg-brand-surface transition-colors text-center"
          >
            Join a Pool
          </Link>
        </div>

        <p className="text-brand-muted text-sm">
          No credit card required · Free to run · Players join in under a minute
        </p>
        <p className="text-brand-muted text-sm mt-4">
          🏀 Starting with March Madness · 🏈 Fantasy Football coming · ⛳ Golf pools · 🏆 More every season
        </p>
      </section>

      {/* Pain Points */}
      <section className="relative z-10 py-20 px-6 border-t border-brand-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-4">
            Sound familiar?
          </h2>
          <p className="text-brand-muted text-center mb-12">Every commissioner deals with this every year.</p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: '💸', pain: '"Did you Venmo me yet?"', fix: 'Collect entry fees automatically via Stripe or PayPal. They pay, you get notified. Done.' },
              { emoji: '😩', pain: '"Wait, did you submit your bracket?"', fix: 'Automated reminders go out before the deadline. One tap from you, handled.' },
              { emoji: '📊', pain: '"Wait who\'s winning right now?"', fix: 'Live leaderboard, round recaps, and upset alerts go to everyone automatically.' },
            ].map(({ emoji, pain, fix }) => (
              <div key={pain} className="bg-brand-card rounded-2xl p-6">
                <div className="text-3xl mb-4">{emoji}</div>
                <p className="text-brand-muted line-through text-sm mb-3">{pain}</p>
                <p className="font-medium">{fix}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-20 px-6 bg-brand-surface/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-4">Built for every league you run</h2>
          <p className="text-brand-muted text-center mb-16">Whether it&apos;s bracket pools, fantasy leagues, or survivor — one platform, zero hassle.</p>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: '⚡',
                title: 'Players join in under a minute',
                desc: 'Click the invite link, enter an email, click once to confirm. No new account to create. No password. Just picks.'
              },
              {
                icon: '💰',
                title: 'Entry fees, handled',
                desc: 'Stripe, PayPal, Venmo, Cash App, Zelle — your players pay how they want. You see who\'s paid in real time.'
              },
              {
                icon: '🏆',
                title: 'Multiple brackets per person',
                desc: 'Let players submit up to 3 brackets. Bigger pot, more fun, more trash talk. You set the rules.'
              },
              {
                icon: '📣',
                title: 'Automatic round recaps',
                desc: 'After every round, standings go out to everyone. Upset alerts fire in real time. Your pool stays active all tournament.'
              },
              {
                icon: '💬',
                title: 'Built-in smack talk',
                desc: 'A dedicated feed for trash talk, reactions, and bracket drama. Keeps your group engaged between games.'
              },
              {
                icon: '🎯',
                title: 'You look like a hero',
                desc: 'A polished, professional bracket experience — under your pool name, your rules. Your league thinks you built it.'
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <span className="text-2xl flex-shrink-0 mt-1">{icon}</span>
                <div>
                  <h3 className="font-bold text-lg mb-2">{title}</h3>
                  <p className="text-brand-muted">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon Sports */}
      <section className="relative z-10 py-16 px-6 border-t border-brand-border">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-brand-muted text-sm font-medium uppercase tracking-wider mb-6">Starting with March Madness · More coming soon</p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { emoji: '🏀', label: 'Bracket Pools', status: 'live' },
              { emoji: '🏈', label: 'Fantasy Football', status: 'soon' },
              { emoji: '⛳', label: 'Golf Pools', status: 'soon' },
              { emoji: '🏒', label: 'Hockey Pools', status: 'soon' },
              { emoji: '⚾', label: 'Baseball', status: 'soon' },
              { emoji: '🎯', label: 'Survivor Pools', status: 'soon' },
              { emoji: '🏆', label: 'More Sports', status: 'soon' },
            ].map(({ emoji, label, status }) => (
              <div key={label} className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${
                status === 'live'
                  ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                  : 'border-brand-border text-brand-muted'
              }`}>
                <span>{emoji}</span>
                <span>{label}</span>
                {status === 'live' && <span className="text-xs bg-brand-orange text-white px-1.5 py-0.5 rounded-full">Live</span>}
                {status === 'soon' && <span className="text-xs text-brand-muted">Soon</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* vs. Competitors */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-4">Why commissioners switch to UFSL</h2>
          <p className="text-brand-muted text-center mb-12">They&apos;re fine for free fun. You need more.</p>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left py-3 text-brand-muted font-medium"></th>
                  <th className="py-3 font-black text-brand-orange">UFSL Bracket</th>
                  <th className="py-3 text-brand-muted font-medium">ESPN / Yahoo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {[
                  ['Entry fee collection', '✅ Automatic', '❌ You chase everyone'],
                  ['Player onboarding', '✅ Under 1 minute', '⚠️ New account required'],
                  ['Multiple brackets', '✅ Commissioner controls', '⚠️ Limited'],
                  ['Live upset alerts', '✅ Real-time', '❌ None'],
                  ['Smack talk feed', '✅ Built in', '❌ None'],
                  ['Round recaps', '✅ Automatic', '❌ You do it'],
                  ['Custom payout splits', '✅ Yes', '❌ No'],
                  ['Works on mobile', '✅ App-quality', '⚠️ Clunky'],
                  ['Works for any sport/pool type', '✅ Built for it', '❌ Sport-specific only'],
                ].map(([feature, us, them]) => (
                  <tr key={feature}>
                    <td className="py-3 text-sm text-brand-muted">{feature}</td>
                    <td className="py-3 text-center font-medium">{us}</td>
                    <td className="py-3 text-center text-brand-muted text-sm">{them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative z-10 py-20 px-6 bg-brand-surface/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-16">Up and running in 5 minutes</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Create your pool', desc: 'Set your entry fee, payout structure, and bracket rules. Takes 2 minutes.' },
              { step: '2', title: 'Share the link', desc: 'One link, sent anywhere. Text, Discord, group chat. Players join in seconds.' },
              { step: '3', title: 'Watch the chaos', desc: 'We handle payments, reminders, leaderboard, and updates. You just win.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-orange text-white font-black text-xl flex items-center justify-center mx-auto mb-4">{step}</div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-brand-muted text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-black mb-4">
            Your league deserves better.<br />
            <span className="text-brand-orange">Start with March Madness.</span>
          </h2>
          <p className="text-brand-muted mb-10">
            Free to start. Your players will love it. And next season — we&apos;ll have even more for you.
          </p>
          <Link
            href="/auth?mode=commissioner"
            className="inline-block bg-brand-orange text-white font-black text-xl px-10 py-5 rounded-2xl hover:bg-brand-orange/90 transition-colors"
          >
            Start Your Pool — Free
          </Link>
          <p className="text-brand-muted text-sm mt-6">
            Already have a pool? <Link href="/auth" className="text-brand-orange underline">Join here →</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-brand-border py-8 text-center text-brand-muted text-sm">
        <p>&copy; 2026 UFSL Bracket · <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link> · <Link href="/terms" className="hover:text-white transition-colors">Terms</Link></p>
      </footer>
    </main>
  )
}
