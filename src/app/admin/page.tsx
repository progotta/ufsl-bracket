import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Cpu, Users, Trophy, Gamepad2 } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = createServerClient()

  const [
    { count: userCount },
    { count: bracketCount },
    { count: poolCount },
    { count: gameCount },
    { data: sim },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('brackets').select('*', { count: 'exact', head: true }),
    supabase.from('pools').select('*', { count: 'exact', head: true }),
    supabase.from('games').select('*', { count: 'exact', head: true }),
    supabase.from('simulation_config').select('is_simulation_mode,sim_label,current_simulated_date').single(),
  ])

  const stats = [
    { label: 'Users', value: userCount ?? 0, icon: Users, href: '/admin/users' },
    { label: 'Brackets', value: bracketCount ?? 0, icon: Gamepad2, href: '/admin/games' },
    { label: 'Pools', value: poolCount ?? 0, icon: Trophy, href: '/admin/pools' },
    { label: 'Games', value: gameCount ?? 0, icon: Gamepad2, href: '/admin/games' },
  ]

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Sim status */}
      <div className={`rounded-xl border p-4 flex items-center justify-between ${sim?.is_simulation_mode ? 'bg-yellow-500/10 border-yellow-500/40' : 'bg-brand-surface border-brand-border'}`}>
        <div>
          <div className="font-semibold flex items-center gap-2">
            <Cpu size={16} />
            Simulation Mode
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${sim?.is_simulation_mode ? 'bg-yellow-500 text-black' : 'bg-brand-border text-brand-muted'}`}>
              {sim?.is_simulation_mode ? 'ACTIVE' : 'OFF'}
            </span>
          </div>
          {sim?.is_simulation_mode && (
            <div className="text-sm text-brand-muted mt-1">
              {sim.sim_label} — {sim.current_simulated_date ? new Date(sim.current_simulated_date).toLocaleString() : 'no date set'}
            </div>
          )}
        </div>
        <Link href="/admin/simulator" className="btn-secondary text-sm">Manage →</Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="bg-brand-surface border border-brand-border rounded-xl p-4 hover:border-brand-orange transition-colors">
            <div className="flex items-center gap-2 text-brand-muted mb-1">
              <Icon size={14} />
              <span className="text-xs uppercase tracking-wide">{label}</span>
            </div>
            <div className="text-3xl font-black">{value.toLocaleString()}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
