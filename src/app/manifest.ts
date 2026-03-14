import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UFSL Bracket Challenge',
    short_name: 'UFSL Bracket',
    description: 'March Madness bracket pool',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#f97316',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
    ],
  }
}
