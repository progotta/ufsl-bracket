import clsx from 'clsx'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
}

export default function Logo({ size = 'md', showTagline = false }: LogoProps) {
  const sizes = {
    sm: { title: 'text-lg', badge: 'text-xs px-2 py-0.5', emoji: 'text-xl' },
    md: { title: 'text-2xl', badge: 'text-sm px-3 py-1', emoji: 'text-2xl' },
    lg: { title: 'text-4xl', badge: 'text-base px-4 py-1.5', emoji: 'text-4xl' },
  }
  const s = sizes[size]

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3">
        <span className={s.emoji}>🏀</span>
        <div>
          <div className={clsx('font-black tracking-tight leading-none', s.title)}>
            <span className="text-white">UFSL </span>
            <span className="bg-brand-gradient bg-clip-text text-transparent">BRACKET</span>
          </div>
          <div className={clsx('font-bold tracking-widest text-brand-muted uppercase', 
            size === 'lg' ? 'text-sm' : 'text-xs'
          )}>
            CHALLENGE
          </div>
        </div>
      </div>
      {showTagline && (
        <p className="text-brand-muted text-sm">March Madness • UFSL.net</p>
      )}
    </div>
  )
}
