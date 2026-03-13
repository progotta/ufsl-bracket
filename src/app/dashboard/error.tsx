'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="bg-brand-surface border border-red-500/30 rounded-2xl p-8 max-w-lg w-full text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-brand-muted text-sm mb-4">{error.message || 'An unexpected error occurred'}</p>
        {error.digest && <p className="text-xs text-brand-muted mb-4">Digest: {error.digest}</p>}
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary text-sm">Try again</button>
          <Link href="/" className="btn-secondary text-sm">Go home</Link>
        </div>
      </div>
    </div>
  )
}
