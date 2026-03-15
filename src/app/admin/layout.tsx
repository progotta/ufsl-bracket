import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Activity, Cpu, Gamepad2, Users, Trophy, ClipboardList } from 'lucide-react'

const ADMIN_IDS = (process.env.ADMIN_USER_IDS || '').split(',')

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_IDS.includes(user.id)) redirect('/')

  const nav = [
    { href: '/admin', label: 'Dashboard', icon: Activity },
    { href: '/admin/simulator', label: 'Simulator', icon: Cpu },
    { href: '/admin/bracket-setup', label: '2026 Bracket', icon: ClipboardList },
    { href: '/admin/games', label: 'Games', icon: Gamepad2 },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/pools', label: 'Pools', icon: Trophy },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      {/* Top nav bar — mobile friendly */}
      <header className="bg-brand-surface border-b border-brand-border sticky top-0 z-30">
        <div className="px-4 py-2">
          <div className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-2">Admin</div>
          <nav className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-brand-muted hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap shrink-0"
              >
                <Icon size={14} />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
    </div>
  )
}
