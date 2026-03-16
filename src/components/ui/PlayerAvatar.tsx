'use client'

import React from 'react'

// ─── Deterministic hash ───────────────────────────────────────────────────────
function hashUserId(userId: string): number {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

// ─── SVG Cartoon Icons ────────────────────────────────────────────────────────

function SharkIcon() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* dorsal fin */}
      <polygon points="50,16 67,50 33,50" fill="#90E0EF" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
      {/* body */}
      <ellipse cx="50" cy="65" rx="34" ry="22" fill="#90E0EF" stroke="white" strokeWidth="2"/>
      {/* belly */}
      <ellipse cx="50" cy="71" rx="20" ry="13" fill="white"/>
      {/* eye */}
      <circle cx="37" cy="59" r="5.5" fill="white"/>
      <circle cx="37" cy="59" r="3" fill="#1a1a2e"/>
      <circle cx="38.5" cy="57.5" r="1.2" fill="white"/>
      {/* smile / jaw line */}
      <path d="M30 75 Q50 87 70 75" stroke="#023E8A" strokeWidth="2.5" fill="none"/>
      {/* teeth */}
      <path d="M36 75 L39 79 L43 75 L47 79 L51 75 L55 79 L59 75 L63 79 L64 75"
        fill="white" stroke="white" strokeWidth="1"/>
    </svg>
  )
}

function EagleIcon() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* body / head */}
      <circle cx="50" cy="55" r="30" fill="#8B4513" stroke="white" strokeWidth="2"/>
      {/* white head */}
      <ellipse cx="50" cy="36" rx="22" ry="18" fill="white"/>
      {/* left eye */}
      <circle cx="38" cy="38" r="7" fill="#FFD700"/>
      <circle cx="38" cy="38" r="4" fill="#1a1a2e"/>
      <circle cx="39.5" cy="36.5" r="1.5" fill="white"/>
      {/* right eye */}
      <circle cx="62" cy="38" r="7" fill="#FFD700"/>
      <circle cx="62" cy="38" r="4" fill="#1a1a2e"/>
      <circle cx="63.5" cy="36.5" r="1.5" fill="white"/>
      {/* fierce brows */}
      <path d="M30 32 L46 36" stroke="#333" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M70 32 L54 36" stroke="#333" strokeWidth="3.5" strokeLinecap="round"/>
      {/* beak */}
      <path d="M44 50 L56 50 L50 62 Z" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
    </svg>
  )
}

function WolfIcon() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* left ear */}
      <polygon points="22,18 34,48 10,48" fill="#9CA3AF" stroke="white" strokeWidth="2"/>
      <polygon points="22,22 31,44 16,44" fill="#E9D5FF"/>
      {/* right ear */}
      <polygon points="78,18 66,48 90,48" fill="#9CA3AF" stroke="white" strokeWidth="2"/>
      <polygon points="78,22 69,44 84,44" fill="#E9D5FF"/>
      {/* head */}
      <circle cx="50" cy="58" r="30" fill="#9CA3AF" stroke="white" strokeWidth="2"/>
      {/* snout */}
      <ellipse cx="50" cy="70" rx="16" ry="12" fill="#D1D5DB"/>
      {/* left eye */}
      <ellipse cx="37" cy="54" rx="7" ry="6" fill="#A78BFA"/>
      <circle cx="37" cy="54" r="3.5" fill="#1a1a2e"/>
      <circle cx="38.5" cy="52.5" r="1.2" fill="white"/>
      {/* right eye */}
      <ellipse cx="63" cy="54" rx="7" ry="6" fill="#A78BFA"/>
      <circle cx="63" cy="54" r="3.5" fill="#1a1a2e"/>
      <circle cx="64.5" cy="52.5" r="1.2" fill="white"/>
      {/* nose */}
      <ellipse cx="50" cy="65" rx="5" ry="3.5" fill="#4B5563"/>
      {/* mouth */}
      <path d="M44 71 Q50 76 56 71" stroke="#6B7280" strokeWidth="2" fill="none"/>
    </svg>
  )
}

function LionIcon() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* mane */}
      <circle cx="50" cy="53" r="36" fill="#D97706"/>
      {/* mane texture (spiky) */}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const x1 = 50 + 30 * Math.cos(rad)
        const y1 = 53 + 30 * Math.sin(rad)
        const x2 = 50 + 40 * Math.cos(rad)
        const y2 = 53 + 40 * Math.sin(rad)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#B45309" strokeWidth="5" strokeLinecap="round"/>
      })}
      {/* face */}
      <circle cx="50" cy="53" r="24" fill="#FCD34D" stroke="white" strokeWidth="1.5"/>
      {/* snout */}
      <ellipse cx="50" cy="63" rx="13" ry="9" fill="#FDE68A"/>
      {/* left eye */}
      <circle cx="39" cy="49" r="5.5" fill="#92400E"/>
      <circle cx="39" cy="49" r="3" fill="#1a1a2e"/>
      <circle cx="40.5" cy="47.5" r="1.2" fill="white"/>
      {/* right eye */}
      <circle cx="61" cy="49" r="5.5" fill="#92400E"/>
      <circle cx="61" cy="49" r="3" fill="#1a1a2e"/>
      <circle cx="62.5" cy="47.5" r="1.2" fill="white"/>
      {/* nose */}
      <ellipse cx="50" cy="60" rx="4.5" ry="3" fill="#92400E"/>
      {/* mouth */}
      <path d="M44 66 Q50 72 56 66" stroke="#92400E" strokeWidth="2" fill="none"/>
      <line x1="50" y1="63" x2="50" y2="67" stroke="#92400E" strokeWidth="2"/>
    </svg>
  )
}

function BearIcon() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* left ear */}
      <circle cx="26" cy="30" r="14" fill="#78350F" stroke="white" strokeWidth="2"/>
      <circle cx="26" cy="30" r="8" fill="#92400E"/>
      {/* right ear */}
      <circle cx="74" cy="30" r="14" fill="#78350F" stroke="white" strokeWidth="2"/>
      <circle cx="74" cy="30" r="8" fill="#92400E"/>
      {/* head */}
      <circle cx="50" cy="58" r="32" fill="#78350F" stroke="white" strokeWidth="2"/>
      {/* snout */}
      <ellipse cx="50" cy="68" rx="16" ry="12" fill="#92400E"/>
      {/* left eye */}
      <circle cx="37" cy="52" r="6" fill="white"/>
      <circle cx="37" cy="52" r="3.5" fill="#1a1a2e"/>
      <circle cx="38.5" cy="50.5" r="1.2" fill="white"/>
      {/* right eye */}
      <circle cx="63" cy="52" r="6" fill="white"/>
      <circle cx="63" cy="52" r="3.5" fill="#1a1a2e"/>
      <circle cx="64.5" cy="50.5" r="1.2" fill="white"/>
      {/* nose */}
      <ellipse cx="50" cy="64" rx="5" ry="3.5" fill="#1a1a2e"/>
      {/* smile */}
      <path d="M43 70 Q50 77 57 70" stroke="#1a1a2e" strokeWidth="2" fill="none"/>
    </svg>
  )
}

function FoxIcon() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* left ear */}
      <polygon points="20,10 36,50 8,44" fill="#F97316" stroke="white" strokeWidth="2"/>
      <polygon points="22,18 34,46 14,41" fill="#FEF3C7"/>
      {/* right ear */}
      <polygon points="80,10 64,50 92,44" fill="#F97316" stroke="white" strokeWidth="2"/>
      <polygon points="78,18 66,46 86,41" fill="#FEF3C7"/>
      {/* head */}
      <circle cx="50" cy="58" r="30" fill="#F97316" stroke="white" strokeWidth="2"/>
      {/* white face mask */}
      <ellipse cx="50" cy="65" rx="18" ry="20" fill="white"/>
      {/* left eye */}
      <ellipse cx="36" cy="52" rx="6.5" ry="7" fill="#65A30D"/>
      <ellipse cx="36" cy="52" rx="2.5" ry="5" fill="#1a1a2e"/>
      <circle cx="37" cy="49" r="1.2" fill="white"/>
      {/* right eye */}
      <ellipse cx="64" cy="52" rx="6.5" ry="7" fill="#65A30D"/>
      <ellipse cx="64" cy="52" rx="2.5" ry="5" fill="#1a1a2e"/>
      <circle cx="65" cy="49" r="1.2" fill="white"/>
      {/* nose */}
      <ellipse cx="50" cy="65" rx="5" ry="3.5" fill="#1a1a2e"/>
      {/* whiskers */}
      <line x1="22" y1="66" x2="44" y2="68" stroke="#9CA3AF" strokeWidth="1.5"/>
      <line x1="22" y1="70" x2="44" y2="70" stroke="#9CA3AF" strokeWidth="1.5"/>
      <line x1="78" y1="66" x2="56" y2="68" stroke="#9CA3AF" strokeWidth="1.5"/>
      <line x1="78" y1="70" x2="56" y2="70" stroke="#9CA3AF" strokeWidth="1.5"/>
      {/* smile */}
      <path d="M44 72 Q50 78 56 72" stroke="#78350F" strokeWidth="2" fill="none"/>
    </svg>
  )
}

function TigerIcon() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* left ear */}
      <polygon points="22,14 36,48 10,46" fill="#FB923C" stroke="white" strokeWidth="2"/>
      <polygon points="23,20 34,44 14,43" fill="#FEF3C7"/>
      {/* right ear */}
      <polygon points="78,14 64,48 90,46" fill="#FB923C" stroke="white" strokeWidth="2"/>
      <polygon points="77,20 66,44 86,43" fill="#FEF3C7"/>
      {/* head */}
      <circle cx="50" cy="58" r="30" fill="#FB923C" stroke="white" strokeWidth="2"/>
      {/* stripes */}
      <path d="M36 28 Q38 36 34 44" stroke="#1a1a2e" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M50 24 Q50 34 50 42" stroke="#1a1a2e" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M64 28 Q62 36 66 44" stroke="#1a1a2e" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      {/* snout */}
      <ellipse cx="50" cy="68" rx="16" ry="12" fill="#FED7AA"/>
      {/* left eye */}
      <ellipse cx="36" cy="52" rx="6.5" ry="7" fill="#16A34A"/>
      <ellipse cx="36" cy="52" rx="2.5" ry="5.5" fill="#1a1a2e"/>
      <circle cx="37" cy="49" r="1.2" fill="white"/>
      {/* right eye */}
      <ellipse cx="64" cy="52" rx="6.5" ry="7" fill="#16A34A"/>
      <ellipse cx="64" cy="52" rx="2.5" ry="5.5" fill="#1a1a2e"/>
      <circle cx="65" cy="49" r="1.2" fill="white"/>
      {/* nose */}
      <ellipse cx="50" cy="64" rx="5" ry="3.5" fill="#9F1239"/>
      {/* mouth */}
      <path d="M43 70 Q50 77 57 70" stroke="#7F1D1D" strokeWidth="2" fill="none"/>
      <line x1="50" y1="67" x2="50" y2="71" stroke="#7F1D1D" strokeWidth="2"/>
    </svg>
  )
}

function PenguinIcon() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* body */}
      <ellipse cx="50" cy="65" rx="28" ry="28" fill="#1E293B" stroke="white" strokeWidth="2"/>
      {/* white belly */}
      <ellipse cx="50" cy="70" rx="17" ry="22" fill="white"/>
      {/* head */}
      <circle cx="50" cy="38" r="22" fill="#1E293B" stroke="white" strokeWidth="2"/>
      {/* face */}
      <ellipse cx="50" cy="40" rx="14" ry="16" fill="white"/>
      {/* left eye */}
      <circle cx="43" cy="34" r="5.5" fill="#60A5FA"/>
      <circle cx="43" cy="34" r="3" fill="#1a1a2e"/>
      <circle cx="44.5" cy="32.5" r="1.2" fill="white"/>
      {/* right eye */}
      <circle cx="57" cy="34" r="5.5" fill="#60A5FA"/>
      <circle cx="57" cy="34" r="3" fill="#1a1a2e"/>
      <circle cx="58.5" cy="32.5" r="1.2" fill="white"/>
      {/* beak */}
      <ellipse cx="50" cy="44" rx="5" ry="3.5" fill="#FBBF24"/>
      {/* wings */}
      <ellipse cx="22" cy="68" rx="8" ry="18" fill="#1E293B" stroke="white" strokeWidth="1.5" transform="rotate(-15 22 68)"/>
      <ellipse cx="78" cy="68" rx="8" ry="18" fill="#1E293B" stroke="white" strokeWidth="1.5" transform="rotate(15 78 68)"/>
    </svg>
  )
}

// ─── Avatar config ────────────────────────────────────────────────────────────

const AVATARS = [
  { label: 'Shark',   bg: '#0077B6', shadow: 'shadow-blue-700/50',   Icon: SharkIcon   },
  { label: 'Eagle',   bg: '#7C2D12', shadow: 'shadow-orange-900/50', Icon: EagleIcon   },
  { label: 'Wolf',    bg: '#4C1D95', shadow: 'shadow-purple-900/50', Icon: WolfIcon    },
  { label: 'Lion',    bg: '#92400E', shadow: 'shadow-amber-900/50',  Icon: LionIcon    },
  { label: 'Bear',    bg: '#065F46', shadow: 'shadow-emerald-900/50',Icon: BearIcon    },
  { label: 'Fox',     bg: '#9A3412', shadow: 'shadow-orange-900/50', Icon: FoxIcon     },
  { label: 'Tiger',   bg: '#991B1B', shadow: 'shadow-red-900/50',    Icon: TigerIcon   },
  { label: 'Penguin', bg: '#1E3A5F', shadow: 'shadow-blue-900/50',   Icon: PenguinIcon },
]

// ─── PlayerAvatar Component ───────────────────────────────────────────────────

interface PlayerAvatarProps {
  userId: string
  displayName?: string | null
  avatarUrl?: string | null
  /** Tailwind size class, e.g. "w-8 h-8" or "w-14 h-14" */
  size?: string
  /** Extra classes on the wrapper */
  className?: string
  /** Border color class */
  borderClass?: string
  rounded?: 'full' | '2xl'
}

export default function PlayerAvatar({
  userId,
  displayName,
  avatarUrl,
  size = 'w-10 h-10',
  className = '',
  borderClass = 'border-brand-border',
  rounded = 'full',
}: PlayerAvatarProps) {
  const roundedClass = rounded === 'full' ? 'rounded-full' : 'rounded-2xl'

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={displayName || 'Avatar'}
        className={`${size} ${roundedClass} border-2 ${borderClass} object-cover flex-shrink-0 ${className}`}
      />
    )
  }

  const idx = hashUserId(userId) % AVATARS.length
  const avatar = AVATARS[idx]
  const Icon = avatar.Icon

  return (
    <div
      className={`${size} ${roundedClass} border-2 ${borderClass} flex-shrink-0 overflow-hidden flex items-center justify-center ${className}`}
      style={{ background: avatar.bg }}
      title={`${displayName ?? 'Player'} (${avatar.label})`}
    >
      <Icon />
    </div>
  )
}
