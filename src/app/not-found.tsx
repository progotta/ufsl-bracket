import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-black bg-brand-gradient bg-clip-text text-transparent mb-4">
          404
        </div>
        <div className="text-6xl mb-6">🏀</div>
        <h1 className="text-2xl font-bold mb-2">Out of bounds!</h1>
        <p className="text-brand-muted mb-8">That page doesn't exist — maybe it was eliminated in the first round.</p>
        <Link href="/dashboard" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
