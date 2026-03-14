'use client'
import { Component, ReactNode } from 'react'

export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error) { console.error('[ErrorBoundary]', error) }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center text-brand-muted">
          <p>Something went wrong loading this section.</p>
          <button onClick={() => this.setState({ hasError: false })} className="text-brand-orange mt-2 underline text-sm">Try again</button>
        </div>
      )
    }
    return this.props.children
  }
}
