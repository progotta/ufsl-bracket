'use client'
import { useEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function RealtimeStatus() {
  const [show, setShow] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const connectedOnceRef = useRef(false)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase.channel('status-check')
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          connectedOnceRef.current = true
          if (timerRef.current) clearTimeout(timerRef.current)
          setShow(false)
        } else if (connectedOnceRef.current) {
          // Only show banner if we've connected before (not on initial load)
          // and wait 3s before showing — brief drops shouldn't alarm anyone
          timerRef.current = setTimeout(() => setShow(true), 3000)
        }
      })

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      supabase.removeChannel(channel)
    }
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-yellow-500/90 text-black text-xs font-bold px-3 py-1.5 rounded-full">
      ⚠️ Reconnecting…
    </div>
  )
}
