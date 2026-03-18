import { getAvatarIcon, getAvatarImageUrl } from '@/lib/avatars'

interface AvatarIconProps {
  avatarKey: string | null | undefined
  size?: number
  className?: string
  fallbackInitial?: string
}

export default function AvatarIcon({ avatarKey, size = 32, className = '', fallbackInitial }: AvatarIconProps) {
  const icon = getAvatarIcon(avatarKey)

  if (!icon) {
    // Default: show first letter or generic silhouette
    const initial = (fallbackInitial || '?')[0].toUpperCase()
    return (
      <div
        className={`rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold flex-shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initial}
      </div>
    )
  }

  const imageUrl = getAvatarImageUrl(avatarKey)

  // Polar bear: no twemoji CDN image, render native emoji
  if (!imageUrl && icon.emoji) {
    return (
      <span
        className={`flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.7, lineHeight: 1 }}
        title={icon.label}
        role="img"
        aria-label={icon.label}
      >
        {icon.emoji}
      </span>
    )
  }

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        width={size}
        height={size}
        alt={icon.label}
        className={`flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  // Shouldn't reach here, but fallback
  return (
    <div
      className={`rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold flex-shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      ?
    </div>
  )
}
