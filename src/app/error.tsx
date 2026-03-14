'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">😵</div>
        <h1 className="text-3xl font-black mb-2">Something went wrong</h1>
        <p className="text-brand-muted mb-6">
          An unexpected error occurred. Try refreshing the page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="btn-primary">
            Try Again
          </button>
          <a href="/dashboard" className="btn-secondary">
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
