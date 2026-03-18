export const AVATAR_ICONS = [
  { key: "lion",       emoji: "🦁", label: "Lion",        twemoji: "1f981" },
  { key: "tiger",      emoji: "🐯", label: "Tiger",       twemoji: "1f42f" },
  { key: "panther",    emoji: "🐆", label: "Panther",     twemoji: "1f406" },
  { key: "bear",       emoji: "🐻", label: "Bear",        twemoji: "1f43b" },
  { key: "polar-bear", emoji: "🐻‍❄️", label: "Polar Bear", twemoji: null },
  { key: "wolf",       emoji: "🐺", label: "Wolf",        twemoji: "1f43a" },
  { key: "fox",        emoji: "🦊", label: "Fox",         twemoji: "1f98a" },
  { key: "eagle",      emoji: "🦅", label: "Eagle",       twemoji: "1f985" },
  { key: "owl",        emoji: "🦉", label: "Owl",         twemoji: "1f989" },
  { key: "shark",      emoji: "🦈", label: "Shark",       twemoji: "1f988" },
  { key: "kraken",     emoji: "🦑", label: "Kraken",      twemoji: "1f991" },
  { key: "gator",      emoji: "🐊", label: "Gator",       twemoji: "1f40a" },
  { key: "dragon",     emoji: "🐲", label: "Dragon",      twemoji: "1f432" },
  { key: "viper",      emoji: "🐍", label: "Viper",       twemoji: "1f40d" },
  { key: "komodo",     emoji: "🦎", label: "Komodo",      twemoji: "1f98e" },
  { key: "scorpion",   emoji: "🦂", label: "Scorpion",    twemoji: "1f982" },
  { key: "spider",     emoji: "🕷️", label: "Spider",      twemoji: "1f577-fe0f" },
  { key: "hornet",     emoji: "🐝", label: "Hornet",      twemoji: "1f41d" },
  { key: "gorilla",    emoji: "🦍", label: "Gorilla",     twemoji: "1f98d" },
  { key: "rhino",      emoji: "🦏", label: "Rhino",       twemoji: "1f98f" },
  { key: "razorback",  emoji: "🐗", label: "Razorback",   twemoji: "1f417" },
  { key: "bull",       emoji: "🐂", label: "Bull",        twemoji: "1f402" },
  { key: "hippo",      emoji: "🦛", label: "Hippo",       twemoji: "1f99b" },
  { key: "buffalo",    emoji: "🦬", label: "Buffalo",     twemoji: "1f9ac" },
  { key: "wolverine",  emoji: null, label: "Wolverine",   twemoji: null, customSvg: "/avatars/wolverine.svg" },
  { key: "honey-badger", emoji: null, label: "Honey Badger", twemoji: null, customSvg: "/avatars/honey-badger.svg" },
] as const

export type AvatarIconKey = typeof AVATAR_ICONS[number]["key"]

export function getAvatarIcon(key: string | null | undefined) {
  if (!key) return null
  return AVATAR_ICONS.find(a => a.key === key) ?? null
}

const TWEMOJI_BASE = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg"

export function getAvatarImageUrl(key: string | null | undefined): string | null {
  const icon = getAvatarIcon(key)
  if (!icon) return null
  if ('customSvg' in icon && icon.customSvg) return icon.customSvg
  if (icon.twemoji) return `${TWEMOJI_BASE}/${icon.twemoji}.svg`
  return null // polar-bear fallback: render native emoji
}
