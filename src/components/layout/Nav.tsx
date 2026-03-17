'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/ui/Logo'
import type { Profile } from '@/types/database'
import { LogOut, User, Trophy, Home, Menu, X, Globe, RefreshCw, Medal, Shield } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'
import NotificationBell from './NotificationBell'

interface NavProps {
  profile: Profile | null
}

export default function Nav({ profile }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: <Home size={16} /> },
    { href: '/pools', label: 'Pools', icon: <Trophy size={16} /> },
    { href: '/commissioner', label: 'My Leagues', icon: <Shield size={16} /> },
    { href: '/second-chance', label: '2nd Chance', icon: <RefreshCw size={16} />, badge: true },
    { href: '/leaderboard', label: 'Rankings', icon: <Globe size={16} /> },
    { href: '/achievements', label: 'Achievements', icon: <Medal size={16} /> },
    { href: '/profile', label: 'Profile', icon: <User size={16} /> },
  ]

  return (
    <header className="sticky top-0 z-50 bg-brand-dark/80 backdrop-blur-xl border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/dashboard">
          <Logo size="sm" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ href, label, icon, badge }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all relative',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-brand-orange/10 text-brand-orange'
                  : 'text-brand-muted hover:text-white hover:bg-brand-card'
              )}
            >
              {icon}
              {label}
              {badge && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium leading-tight">
                {profile?.display_name || 'Champion'}
              </div>
            </div>
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-8 h-8 rounded-full border border-brand-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange text-sm font-bold">
                {(profile?.display_name || 'C')[0].toUpperCase()}
              </div>
            )}
            {profile && <NotificationBell userId={profile.id} />}
            <button
              onClick={handleSignOut}
              className="text-brand-muted hover:text-white transition-colors p-1"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-brand-muted hover:text-white p-1"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-brand-border bg-brand-surface animate-slide-up">
          <div className="px-4 py-3 space-y-1">
            {links.map(({ href, label, icon, badge }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                  pathname === href
                    ? 'bg-brand-orange/10 text-brand-orange'
                    : 'text-brand-muted hover:text-white hover:bg-brand-card'
                )}
              >
                {icon}
                {label}
                {badge && (
                  <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    NEW
                  </span>
                )}
              </Link>
            ))}
            {profile && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-brand-muted">
                <NotificationBell userId={profile.id} />
                <span>Notifications</span>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-brand-muted hover:text-red-400 w-full transition-all"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
