import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🏀</div>
        <h1 className="text-3xl font-black mb-2">Out of bounds!</h1>
        <p className="text-brand-muted mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
          <Link href="/" className="btn-secondary">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
