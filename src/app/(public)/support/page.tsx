import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Support — UFSL',
  description: 'Get help with UFSL — bracket pools, account issues, and more.',
}

const faqs = [
  {
    q: 'How do I join a pool?',
    a: (
      <>
        Ask your pool commissioner for the pool&apos;s invite link or code. Visit{' '}
        <a href="https://ufsl.net/join" className="text-brand-orange hover:underline">
          ufsl.net/join
        </a>{' '}
        and enter the code, or click the invite link directly. You&apos;ll need a UFSL account —
        sign up for free at{' '}
        <a href="https://ufsl.net" className="text-brand-orange hover:underline">
          ufsl.net
        </a>
        . If the pool has an entry fee, you&apos;ll be prompted to pay when joining.
      </>
    ),
  },
  {
    q: 'I forgot my password / can\'t log in.',
    a: (
      <>
        UFSL uses <strong className="text-white">passwordless login</strong> — no passwords to forget!
        On the login page, enter your email address to receive a{' '}
        <strong className="text-white">magic link</strong> (a one-click login link sent to your inbox).
        You can also log in with your phone number via SMS verification, or use{' '}
        <strong className="text-white">Google Sign-In</strong> if you registered with Google.
        If you&apos;re still having trouble, email us at{' '}
        <a href="mailto:shawn@progotta.com" className="text-brand-orange hover:underline">
          shawn@progotta.com
        </a>
        .
      </>
    ),
  },
  {
    q: 'How does scoring work?',
    a: (
      <>
        Scoring is configured by your pool commissioner and may vary by pool. In the default UFSL
        scoring system, you earn points for each correct pick. Points typically increase in later
        rounds — a correct Final Four pick is worth more than a correct Round 1 pick. Your pool&apos;s
        specific scoring rules are shown on the pool page and in the leaderboard. Tiebreakers (if
        any) are set by the commissioner.
      </>
    ),
  },
  {
    q: 'How do I contact my pool commissioner?',
    a: (
      <>
        Open your pool&apos;s page and look for the <strong className="text-white">Commissioner</strong>{' '}
        section or use the <strong className="text-white">Smack Talk</strong> / chat feature within
        the pool to send a message. All pool participants and the commissioner can see the chat.
        If you need to reach the commissioner privately, contact UFSL support and we can help
        facilitate.
      </>
    ),
  },
  {
    q: 'How do I delete my account?',
    a: (
      <>
        You can delete your account from{' '}
        <a href="/settings" className="text-brand-orange hover:underline">
          Settings → Account → Delete Account
        </a>
        . Deleting your account will remove your personal information within 30 days. Note: if you
        have outstanding prize payments owed to you, resolve those before deleting. Entry fees for
        active pools are generally non-refundable after a tournament begins. See our{' '}
        <Link href="/privacy" className="text-brand-orange hover:underline">
          Privacy Policy
        </Link>{' '}
        for details on data retention.
      </>
    ),
  },
  {
    q: 'I submitted my bracket but my picks aren\'t showing.',
    a: (
      <>
        Make sure you clicked <strong className="text-white">Save &amp; Submit</strong> on the bracket
        page — just filling in picks without submitting doesn&apos;t lock them in. If you submitted
        before the deadline and your picks still aren&apos;t appearing, try a hard refresh (Ctrl+Shift+R
        or Cmd+Shift+R) and check again. If the issue persists, email us immediately at{' '}
        <a href="mailto:shawn@progotta.com" className="text-brand-orange hover:underline">
          shawn@progotta.com
        </a>{' '}
        with your username and pool name.
      </>
    ),
  },
  {
    q: 'How do SMS alerts work?',
    a: (
      <>
        You can opt in to SMS alerts in{' '}
        <a href="/profile/notifications" className="text-brand-orange hover:underline">
          Profile → Notifications
        </a>
        . UFSL sends text messages for picks deadlines, round results, standings updates, and payment
        confirmations. Message frequency is typically 2–5 messages per active tournament week.
        Reply <strong className="text-white">STOP</strong> to unsubscribe from any message, or
        disable SMS in your notification settings. Msg &amp; data rates may apply. See our{' '}
        <Link href="/sms-consent" className="text-brand-orange hover:underline">
          SMS Consent page
        </Link>{' '}
        for full details.
      </>
    ),
  },
]

export default function SupportPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Support &amp; Help</h1>
      <p className="text-brand-muted mb-8">
        Need help with UFSL? Browse the common questions below or reach out directly.
      </p>

      {/* Contact card */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-6 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-white font-semibold mb-1">Contact Support</p>
          <p className="text-brand-muted text-sm">
            We typically respond within 24 hours.
          </p>
        </div>
        <a
          href="mailto:shawn@progotta.com"
          className="inline-block bg-brand-orange hover:bg-orange-500 transition-colors text-white font-semibold px-5 py-2.5 rounded-lg text-sm whitespace-nowrap"
        >
          Email Us
        </a>
      </div>

      {/* FAQ */}
      <h2 className="text-xl font-semibold text-white mb-6">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="bg-brand-surface border border-brand-border rounded-xl p-6"
          >
            <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
            <p className="text-brand-muted leading-relaxed text-sm">{faq.a}</p>
          </div>
        ))}
      </div>

      {/* Legal links */}
      <div className="mt-12 pt-8 border-t border-brand-border">
        <p className="text-brand-muted text-sm text-center">
          Also see:{' '}
          <Link href="/privacy" className="text-brand-orange hover:underline">
            Privacy Policy
          </Link>
          {' · '}
          <Link href="/terms" className="text-brand-orange hover:underline">
            Terms of Service
          </Link>
          {' · '}
          <Link href="/sms-consent" className="text-brand-orange hover:underline">
            SMS Consent
          </Link>
        </p>
      </div>
    </div>
  )
}
