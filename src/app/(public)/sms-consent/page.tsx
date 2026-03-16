import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SMS Opt-In Consent — UFSL',
  description: 'SMS opt-in consent information for UFSL text message alerts.',
}

export default function SmsConsentPage() {
  return (
    <article className="prose prose-invert prose-sm sm:prose-base max-w-none">
      <h1 className="text-3xl font-bold text-white mb-2">SMS Opt-In Consent</h1>
      <p className="text-brand-muted text-sm mb-8">Last updated: March 2026</p>

      {/* Hero callout */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-6 mb-8 not-prose">
        <p className="text-brand-muted text-sm font-medium uppercase tracking-wider mb-2">Program Name</p>
        <p className="text-white text-lg font-semibold">UFSL Bracket Alerts</p>
        <p className="text-brand-muted text-sm mt-1">
          Text message notifications for fantasy sports bracket pools at{' '}
          <a href="https://ufsl.net" className="text-brand-orange hover:underline">ufsl.net</a>
        </p>
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">About UFSL</h2>
        <p className="text-brand-muted leading-relaxed">
          <strong className="text-white">UFSL (Ultimate Fantasy Sports League)</strong> is a fantasy sports
          platform at <a href="https://ufsl.net" className="text-brand-orange hover:underline">ufsl.net</a> where
          users create and join bracket pools for NCAA March Madness and other tournaments. Users submit picks,
          track standings on live leaderboards, and compete for prizes within private or public pools.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">How We Collect Your Phone Number</h2>
        <p className="text-brand-muted leading-relaxed mb-3">
          Phone numbers are collected <strong className="text-white">voluntarily</strong> through two
          explicit opt-in paths:
        </p>
        <ol className="list-decimal pl-5 space-y-3 text-brand-muted">
          <li>
            <strong className="text-white">During Account Sign-Up</strong> — When registering at{' '}
            <a href="https://ufsl.net" className="text-brand-orange hover:underline">ufsl.net</a>, users
            may provide their phone number and check a box to opt in to SMS alerts. Providing a phone number
            is optional and not required to use the platform.
          </li>
          <li>
            <strong className="text-white">In Account Notification Settings</strong> — Existing users can
            enable SMS notifications at any time by visiting{' '}
            <a href="https://ufsl.net/profile/notifications" className="text-brand-orange hover:underline">
              ufsl.net/profile/notifications
            </a>
            , entering their phone number, and confirming their opt-in.
          </li>
        </ol>
        <p className="text-brand-muted leading-relaxed mt-4">
          In both cases, users explicitly consent to receiving SMS messages from UFSL before any message
          is sent. Phone numbers are never added to SMS lists without express opt-in consent.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">Opt-In Confirmation Message</h2>
        <p className="text-brand-muted leading-relaxed mb-3">
          Upon opting in, users receive the following confirmation text:
        </p>
        <div className="bg-brand-card border border-brand-border rounded-xl p-5 not-prose">
          <p className="text-white font-medium text-center text-lg">
            &ldquo;You&apos;re signed up for UFSL alerts! Reply STOP to unsubscribe. Msg &amp; data rates may apply.&rdquo;
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">Types of Messages Sent</h2>
        <p className="text-brand-muted leading-relaxed mb-3">
          UFSL sends SMS messages related to your bracket pool activity:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-brand-muted">
          <li><strong className="text-white">Picks Deadline Reminders</strong> — alerts before the bracket lock deadline</li>
          <li><strong className="text-white">Round Results Notifications</strong> — updates when a tournament round concludes</li>
          <li><strong className="text-white">Standings Updates</strong> — your current rank in active pools</li>
          <li><strong className="text-white">Payment Confirmations</strong> — confirmation of entry fee payments and prize distributions</li>
          <li><strong className="text-white">Bracket Status Alerts</strong> — notifications when your bracket is still alive, champion eliminated, etc.</li>
        </ul>
        <p className="text-brand-muted leading-relaxed mt-3">
          We do not send marketing messages unrelated to your active pool participation.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">Message Frequency</h2>
        <p className="text-brand-muted leading-relaxed">
          Message frequency varies based on tournament activity. During an active tournament week, you may
          receive <strong className="text-white">2–5 messages per week</strong>. Outside of active tournament
          periods, messages are minimal or none.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">Message &amp; Data Rates</h2>
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 not-prose">
          <p className="text-white font-semibold text-center">
            Msg &amp; data rates may apply.
          </p>
          <p className="text-brand-muted text-sm text-center mt-1">
            Check with your mobile carrier for details on standard SMS/data charges.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">How to Opt Out</h2>
        <p className="text-brand-muted leading-relaxed mb-3">
          You can stop receiving UFSL text messages at any time using either method:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-brand-muted">
          <li>
            <strong className="text-white">Reply STOP</strong> — text <strong className="text-white">STOP</strong>{' '}
            to any UFSL message. You will receive a confirmation and no further messages will be sent.
          </li>
          <li>
            <strong className="text-white">Notification Settings</strong> — disable SMS in your account at{' '}
            <a href="https://ufsl.net/profile/notifications" className="text-brand-orange hover:underline">
              ufsl.net/profile/notifications
            </a>
            .
          </li>
        </ul>
        <p className="text-brand-muted leading-relaxed mt-3">
          After opting out, you will not receive further SMS messages unless you actively re-enroll.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">Help</h2>
        <p className="text-brand-muted leading-relaxed">
          For assistance with SMS messages:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-brand-muted mt-3">
          <li>
            Reply <strong className="text-white">HELP</strong> to any UFSL text message for basic
            opt-out instructions.
          </li>
          <li>
            Email us at{' '}
            <a href="mailto:support@ufsl.net" className="text-brand-orange hover:underline">
              support@ufsl.net
            </a>{' '}
            for any questions or issues.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">Privacy</h2>
        <p className="text-brand-muted leading-relaxed">
          Your phone number is used only to deliver UFSL alerts. It is transmitted to{' '}
          <strong className="text-white">Twilio</strong> for message delivery and is not sold or shared
          with third parties for marketing purposes. See our full{' '}
          <a href="/privacy" className="text-brand-orange hover:underline">Privacy Policy</a> for details.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
        <p className="text-brand-muted leading-relaxed">
          UFSL — Ultimate Fantasy Sports League<br />
          <a href="https://ufsl.net" className="text-brand-orange hover:underline">ufsl.net</a><br />
          <a href="mailto:support@ufsl.net" className="text-brand-orange hover:underline">support@ufsl.net</a>
        </p>
      </section>
    </article>
  )
}
