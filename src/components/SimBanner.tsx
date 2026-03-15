'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface SimBannerProps {
  // M-2: isAdmin is determined server-side; no UUIDs exposed in the JS bundle
  isAdmin: boolean
}

export default function SimBanner({ isAdmin }: SimBannerProps) {
  const [sim, setSim] = useState<{ label: string; date: string } | null>(null)

  useEffect(() => {
    if (!isAdmin) return
    const supabase = createClient()
    supabase
      .from('simulation_config')
      .select('is_simulation_mode,sim_label,current_simulated_date')
      .single()
      .then(({ data }) => {
        if (data?.is_simulation_mode) {
          setSim({
            label: data.sim_label || 'Simulation',
            date: data.current_simulated_date
              ? new Date(data.current_simulated_date).toLocaleString()
              : '',
          })
        }
      })
  }, [isAdmin])

  if (!sim) return null

  return (
    <Link
      href="/admin/simulator"
      className="block w-full bg-yellow-500 text-black text-xs font-bold text-center py-1.5 px-4 hover:bg-yellow-400 transition-colors z-50"
    >
      🧪 SIM MODE — {sim.label}{sim.date ? ` — ${sim.date}` : ''}
    </Link>
  )
}
