'use client'
import { useEffect } from 'react'

export default function ScrollToTop() {
  useEffect(() => {
    // Disable browser's native scroll restoration so it can't override us on back navigation
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    window.scrollTo(0, 0)
  }, [])
  return null
}
