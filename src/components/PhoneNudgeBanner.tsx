'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, X } from 'lucide-react'

const DISMISS_KEY = 'ufsl_email_nudge_dismissed'

export default function PhoneNudgeBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check localStorage first — if already dismissed, bail
    if (localStorage.getItem(DISMISS_KEY)) return

    // Check sessionStorage — avoid Admin API call on every page load
    const cached = sessionStorage.getItem('ufsl_identity_check')
    if (cached) {
      setShow(cached === 'phone_only')
      return
    }

    // Fetch identities to check if phone-only
    fetch('/api/profile/identities')
      .then((res) => res.ok ? res.json() : null)
      .then((identities: Array<{ provider: string }> | null) => {
        if (!identities) return
        const hasEmail = identities.some((i) => i.provider === 'email')
        const hasPhone = identities.some((i) => i.provider === 'phone')
        const hasOAuth = identities.some((i) =>
          ['google', 'apple', 'facebook'].includes(i.provider)
        )
        // Show banner only if: has phone, and no email, and no OAuth
        const phoneOnly = hasPhone && !hasEmail && !hasOAuth
        sessionStorage.setItem('ufsl_identity_check', phoneOnly ? 'phone_only' : 'has_email')
        setShow(phoneOnly)
      })
      .catch(() => {
        // Silently ignore — non-critical feature
      })
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
      <AlertTriangle size={16} className="text-yellow-400 shrink-0" />
      <p className="flex-1 text-sm text-yellow-300">
        <span className="font-semibold">Add an email to your account</span> so you never lose
        access.{' '}
        <Link
          href="/profile/accounts"
          className="underline hover:text-white transition-colors font-medium"
        >
          Link Email →
        </Link>
      </p>
      <button
        onClick={dismiss}
        className="shrink-0 text-yellow-400/60 hover:text-yellow-300 transition-colors"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  )
}
