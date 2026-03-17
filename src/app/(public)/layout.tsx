import Link from 'next/link'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimal header — no auth check, just UFSL logo */}
      <header className="border-b border-brand-border bg-brand-surface/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-black bg-gradient-to-r from-brand-orange to-brand-gold bg-clip-text text-transparent">
              UFSL
            </span>
            <span className="text-brand-muted text-sm hidden sm:block">
              Ultimate Fantasy Sports League
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-brand-muted hover:text-white transition-colors"
          >
            ← Back to ufsl.net
          </Link>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-border">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-brand-muted justify-center">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span aria-hidden="true">·</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <span aria-hidden="true">·</span>
            <Link href="/support" className="hover:text-white transition-colors">Support</Link>
            <span aria-hidden="true">·</span>
            <Link href="/sms-consent" className="hover:text-white transition-colors">SMS Consent</Link>
          </div>
          <p className="text-center text-brand-muted text-xs mt-4">
            © {new Date().getFullYear()} UFSL — Ultimate Fantasy Sports League. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
