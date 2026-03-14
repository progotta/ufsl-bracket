'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Trophy, Layout, BarChart2, User, Shield } from 'lucide-react'

const tabs = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/pools', icon: Trophy, label: 'Pools' },
  { href: '/commissioner', icon: Shield, label: 'My Leagues' },
  { href: '/leaderboard', icon: BarChart2, label: 'Rankings' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-brand-dark border-t border-brand-border safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[56px] ${
                active
                  ? 'text-brand-orange'
                  : 'text-brand-muted hover:text-white'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
