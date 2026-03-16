import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — UFSL',
  description: 'Terms of service for UFSL — Ultimate Fantasy Sports League.',
}

export default function TermsPage() {
  return (
    <article className="prose prose-invert prose-sm sm:prose-base max-w-none">
      <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
      <p className="text-brand-muted text-sm mb-8">Last updated: March 2026</p>

      <section className="mb-8">
        <p className="text-brand-muted leading-relaxed">
          Welcome to UFSL (Ultimate Fantasy Sports League). By creating an account or using{' '}
          <strong className="text-white">ufsl.net</strong>, you agree to these Terms of Service.
          Please read them carefully.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">1. Eligibility</h2>
        <p className="text-brand-muted leading-relaxed">
          You must be at least <strong className="text-white">13 years old</strong> to use UFSL. By using
          the platform, you represent that you meet this age requirement. Users who are minors (under 18)
          should use the platform only with the consent of a parent or legal guardian.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">2. Account Responsibility</h2>
        <p className="text-brand-muted leading-relaxed">
          You are responsible for maintaining the confidentiality of your account credentials and for all
          activity that occurs under your account. Notify us immediately at{' '}
          <a href="mailto:shawn@progotta.com" className="text-brand-orange hover:underline">
            shawn@progotta.com
          </a>{' '}
          if you suspect unauthorized access. You may not share your account or transfer it to another
          person.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">3. Fantasy Sports — Not Gambling</h2>
        <p className="text-brand-muted leading-relaxed">
          UFSL is a <strong className="text-white">fantasy sports platform</strong>. Paid bracket pools
          on UFSL involve entry fees that are pooled together as prizes for skill-based competition.
          Outcomes are determined by real-world sports results combined with participants&apos;
          skill-based predictions — not by chance alone.
        </p>
        <p className="text-brand-muted leading-relaxed mt-3">
          UFSL does not operate as a gambling platform under applicable U.S. federal and state laws.
          Participation in paid pools is subject to the laws of your jurisdiction. By participating in
          a paid pool, you represent that doing so is legal in your jurisdiction. UFSL is not responsible
          for ensuring compliance with local laws for individual users.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">4. Entry Fees &amp; Payments</h2>
        <p className="text-brand-muted leading-relaxed">
          Pool commissioners set entry fees. Entry fees are collected via Stripe and held until the pool
          concludes, at which point prizes are distributed to winners per the pool&apos;s rules. UFSL
          may charge a platform fee on pools. All fees are clearly disclosed before you submit payment.
          Entry fees are generally non-refundable once a tournament begins.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">5. Commissioner Responsibilities</h2>
        <p className="text-brand-muted leading-relaxed">
          Pool commissioners (users who create and manage pools) are responsible for:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-brand-muted mt-3">
          <li>Setting accurate pool rules, scoring systems, and prize structures before opening the pool.</li>
          <li>Communicating pool rules clearly to all participants.</li>
          <li>Ensuring entry fees are collected and distributed fairly per the stated rules.</li>
          <li>Resolving disputes among pool participants in good faith.</li>
          <li>Ensuring compliance with applicable laws in their jurisdiction.</li>
        </ul>
        <p className="text-brand-muted leading-relaxed mt-3">
          UFSL is a platform provider and is not a party to disputes between commissioners and participants.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibent text-white mb-3">6. Acceptable Use</h2>
        <p className="text-brand-muted leading-relaxed mb-3">You agree not to:</p>
        <ul className="list-disc pl-5 space-y-2 text-brand-muted">
          <li>Use UFSL for any unlawful purpose or in violation of these Terms.</li>
          <li>Attempt to gain unauthorized access to any part of the platform or other users&apos; accounts.</li>
          <li>Use automated tools, bots, or scripts to interact with the platform without prior written consent.</li>
          <li>Submit false, misleading, or fraudulent information.</li>
          <li>Harass, abuse, or harm other users through smack talk or any other feature.</li>
          <li>Reverse engineer, decompile, or attempt to extract the source code of UFSL.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">7. Intellectual Property</h2>
        <p className="text-brand-muted leading-relaxed">
          All content, design, code, and trademarks on UFSL are owned by UFSL or its licensors. You may
          not copy, reproduce, or distribute any part of UFSL without prior written permission. You retain
          ownership of any content you submit (e.g., smack talk posts) but grant UFSL a license to display
          it within the platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">8. Disclaimer of Warranties</h2>
        <p className="text-brand-muted leading-relaxed">
          UFSL is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind,
          express or implied. We do not guarantee that the platform will be uninterrupted, error-free,
          or free of viruses. You use UFSL at your own risk.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">9. Limitation of Liability</h2>
        <p className="text-brand-muted leading-relaxed">
          To the maximum extent permitted by applicable law, UFSL and its operators shall not be liable
          for any indirect, incidental, special, consequential, or punitive damages, including loss of
          profits, data, or goodwill, arising from your use of or inability to use the platform. Our
          total liability for any claim arising from your use of UFSL shall not exceed the amount you
          paid to UFSL in the 12 months preceding the claim.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">10. Account Suspension &amp; Termination</h2>
        <p className="text-brand-muted leading-relaxed">
          UFSL reserves the right to suspend or terminate your account at any time, with or without
          notice, for violations of these Terms, suspected fraud, or any behavior we determine to be
          harmful to the platform or its users. You may delete your own account at any time from your
          account settings.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">11. Governing Law</h2>
        <p className="text-brand-muted leading-relaxed">
          These Terms are governed by the laws of the{' '}
          <strong className="text-white">State of Colorado, United States</strong>, without regard to
          its conflict of law provisions. Any disputes shall be resolved in the courts of Colorado.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">12. Changes to These Terms</h2>
        <p className="text-brand-muted leading-relaxed">
          We may update these Terms from time to time. Continued use of UFSL after changes are posted
          constitutes your acceptance of the revised Terms. We will notify you of material changes via
          email or a notice on the platform.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-3">13. Contact</h2>
        <p className="text-brand-muted leading-relaxed">
          UFSL — Ultimate Fantasy Sports League<br />
          <a href="https://ufsl.net" className="text-brand-orange hover:underline">ufsl.net</a><br />
          <a href="mailto:shawn@progotta.com" className="text-brand-orange hover:underline">shawn@progotta.com</a>
        </p>
      </section>
    </article>
  )
}
