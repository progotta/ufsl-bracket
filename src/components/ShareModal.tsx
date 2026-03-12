'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Twitter, Facebook, Link2, Download, Check, Share2, Instagram } from 'lucide-react'
import clsx from 'clsx'
import {
  getShareText,
  buildBracketShareUrl,
  buildTwitterShareUrl,
  buildFacebookShareUrl,
  type ShareContext,
} from '@/lib/shareText'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  bracketId: string
  userName: string
  poolName: string
  score: number
  rank?: number
  correct?: number
  total?: number
  champion?: string
  poolStatus?: string // 'open' | 'active' | 'completed'
  isBusted?: boolean
  isWinner?: boolean
}

function getStatus(props: ShareModalProps): string {
  if (props.isWinner) return 'won'
  if (props.isBusted) return 'busted'
  if (props.poolStatus === 'active') return 'active'
  return 'pre'
}

function buildImageUrl(props: ShareModalProps, baseUrl: string): string {
  const status = getStatus(props)
  const qs = new URLSearchParams({
    name: props.userName,
    pool: props.poolName,
    score: String(props.score),
    status,
    ...(props.rank ? { rank: String(props.rank) } : {}),
    ...(props.correct !== undefined ? { correct: String(props.correct) } : {}),
    ...(props.total !== undefined ? { total: String(props.total) } : {}),
    ...(props.champion ? { champion: props.champion } : {}),
  })
  return `${baseUrl}/api/bracket/${props.bracketId}/image?${qs.toString()}`
}

function buildShareContext(props: ShareModalProps, link: string): ShareContext {
  if (props.isWinner) {
    return { stage: 'won', points: props.score, link }
  }
  if (props.isBusted) {
    return { stage: 'busted', link }
  }
  if (props.poolStatus === 'active' && props.correct !== undefined && props.total !== undefined && props.rank) {
    return { stage: 'mid-tournament', correct: props.correct, total: props.total, rank: props.rank, link }
  }
  if (props.champion && props.poolStatus === 'open') {
    return { stage: 'pre-tournament', champion: props.champion, link }
  }
  const maxPossible = props.total ? props.total * 10 : 100 // rough estimate
  const percentBusted = props.total ? Math.round((1 - props.correct! / props.total) * 100) : 0
  return { stage: 'generic', percentBusted, link }
}

export default function ShareModal(props: ShareModalProps) {
  const { isOpen, onClose, bracketId } = props
  const [baseUrl, setBaseUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [shareText, setShareText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [bracketUrl, setBracketUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin
      setBaseUrl(origin)
      const bUrl = buildBracketShareUrl(bracketId, origin)
      setBracketUrl(bUrl)
      const iUrl = buildImageUrl(props, origin)
      setImageUrl(iUrl)
      const ctx = buildShareContext(props, bUrl)
      setShareText(getShareText(ctx))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bracketId, props.score, props.rank, props.poolStatus, props.isBusted, props.isWinner])

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(bracketUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text
    }
  }, [bracketUrl])

  const handleDownload = useCallback(async () => {
    if (!imageUrl) return
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `ufsl-bracket-${bracketId}.png`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      // Fallback: open in new tab
      window.open(imageUrl, '_blank')
    }
  }, [imageUrl, bracketId])

  const handleInstagramCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }, [shareText])

  if (!isOpen) return null

  const twitterUrl = buildTwitterShareUrl(shareText)
  const facebookUrl = buildFacebookShareUrl(bracketUrl)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg bg-brand-surface border border-brand-border rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden mx-0 sm:mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-orange/10 flex items-center justify-center">
              <Share2 size={18} className="text-brand-orange" />
            </div>
            <h2 className="text-lg font-bold">Share Your Bracket</h2>
          </div>
          <button
            onClick={onClose}
            className="text-brand-muted hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Image Preview */}
        <div className="px-6 pt-5">
          <div className="relative rounded-2xl overflow-hidden bg-brand-card border border-brand-border aspect-[1200/630]">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
              </div>
            )}
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="Bracket share card"
                className={clsx('w-full h-full object-cover transition-opacity', imageLoaded ? 'opacity-100' : 'opacity-0')}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
              />
            )}
          </div>
        </div>

        {/* Share text */}
        <div className="px-6 pt-4">
          <p className="text-sm text-brand-muted mb-1 font-medium">Caption</p>
          <div className="bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-sm text-white/80 leading-relaxed">
            {shareText}
          </div>
        </div>

        {/* Buttons */}
        <div className="px-6 py-5 space-y-3">
          {/* Primary share buttons */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share on X
            </a>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#1877f2]/10 hover:bg-[#1877f2]/20 border border-[#1877f2]/30 rounded-xl px-4 py-3 text-sm font-semibold text-[#1877f2] transition-colors"
            >
              <Facebook size={16} />
              Facebook
            </a>
          </div>

          {/* Secondary buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleInstagramCopy}
              className="flex flex-col items-center gap-1.5 bg-brand-card hover:bg-brand-border/30 border border-brand-border rounded-xl px-3 py-3 text-xs font-medium text-brand-muted hover:text-white transition-colors"
            >
              <Instagram size={18} className="text-pink-400" />
              Instagram
              <span className="text-[10px] text-brand-muted/60">(copy caption)</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center gap-1.5 bg-brand-card hover:bg-brand-border/30 border border-brand-border rounded-xl px-3 py-3 text-xs font-medium text-brand-muted hover:text-white transition-colors"
            >
              {copied ? (
                <Check size={18} className="text-green-400" />
              ) : (
                <Link2 size={18} className="text-blue-400" />
              )}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={handleDownload}
              className="flex flex-col items-center gap-1.5 bg-brand-card hover:bg-brand-border/30 border border-brand-border rounded-xl px-3 py-3 text-xs font-medium text-brand-muted hover:text-white transition-colors"
            >
              <Download size={18} className="text-brand-orange" />
              Download
            </button>
          </div>
        </div>

        {/* Footer tag */}
        <div className="px-6 pb-5 text-center">
          <p className="text-xs text-brand-muted/50">
            ufsl.net · Ultimate Fantasy Sports League
          </p>
        </div>
      </div>
    </div>
  )
}
