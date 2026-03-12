'use client'

import { useState, useEffect, useRef } from 'react'
import {
  X, Copy, Check, MessageSquare, Mail, Share2,
  Twitter, Link as LinkIcon, Users
} from 'lucide-react'

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
  poolName: string
  inviteCode: string
  inviteUrl: string
  inviterName?: string
  memberCount?: number
  bracketType?: string
}

export default function InviteModal({
  isOpen,
  onClose,
  poolName,
  inviteCode,
  inviteUrl,
  inviterName,
  memberCount,
  bracketType,
}: InviteModalProps) {
  const [copied, setCopied] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  const personalizedMsg = inviterName
    ? `${inviterName} invited you to join their March Madness pool!`
    : 'Join my March Madness bracket pool on UFSL!'

  const fullShareText = `${personalizedMsg} Pool: "${poolName}" — make your picks and compete. Join here:`

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${poolName} on UFSL`,
          text: fullShareText,
          url: inviteUrl,
        })
      } catch {
        handleCopyLink()
      }
    } else {
      handleCopyLink()
    }
  }

  const encodedText = encodeURIComponent(fullShareText)
  const encodedUrl = encodeURIComponent(inviteUrl)

  const shareOptions = [
    {
      label: 'Text / SMS',
      icon: <MessageSquare size={20} />,
      color: 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20',
      action: () => {
        if (navigator.share) {
          handleNativeShare()
        } else {
          window.open(`sms:?body=${encodedText}%20${encodedUrl}`, '_blank')
        }
      },
    },
    {
      label: 'WhatsApp',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      color: 'bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20',
      action: () => window.open(`https://wa.me/?text=${encodedText}%20${encodedUrl}`, '_blank'),
    },
    {
      label: 'Twitter / X',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: 'bg-black/30 border-white/20 text-white hover:bg-white/10',
      action: () => window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank'),
    },
    {
      label: 'Email',
      icon: <Mail size={20} />,
      color: 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20',
      action: () => {
        const subject = encodeURIComponent(`Join my March Madness pool: ${poolName}`)
        const body = encodeURIComponent(`${fullShareText}\n\n${inviteUrl}\n\nOr use invite code: ${inviteCode}`)
        window.open(`mailto:?subject=${subject}&body=${body}`)
      },
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-brand-surface border border-brand-border rounded-2xl w-full max-w-md shadow-2xl animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <div className="bg-brand-orange/10 rounded-xl p-2">
              <Users size={20} className="text-brand-orange" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Invite Friends</h2>
              {memberCount !== undefined && (
                <p className="text-xs text-brand-muted">{memberCount} member{memberCount !== 1 ? 's' : ''} so far</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-brand-muted hover:text-white transition-colors p-1 rounded-lg hover:bg-brand-card"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Pool info */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-4">
            <div className="text-xs text-brand-muted uppercase tracking-wide mb-1">Pool</div>
            <div className="font-bold text-lg">{poolName}</div>
            {bracketType && bracketType !== 'full' && (
              <div className="text-xs text-brand-muted mt-0.5 capitalize">{bracketType.replace(/([A-Z])/g, ' $1')} Bracket</div>
            )}
          </div>

          {/* Invite link */}
          <div>
            <label className="block text-sm font-semibold mb-2">Invite Link</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-brand-card border border-brand-border rounded-xl px-3 py-2.5 flex items-center gap-2 min-w-0">
                <LinkIcon size={14} className="text-brand-muted shrink-0" />
                <span className="text-xs text-brand-muted truncate">{inviteUrl}</span>
              </div>
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 border rounded-xl px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  copied
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-brand-card border-brand-border hover:border-brand-orange text-white'
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Invite code */}
          <div>
            <label className="block text-sm font-semibold mb-2">Invite Code</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-center">
                <span className="text-2xl font-black tracking-widest text-brand-gold">{inviteCode}</span>
              </div>
              <button
                onClick={handleCopyCode}
                className={`border rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  codeCopied
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-brand-card border-brand-border hover:border-brand-orange text-white'
                }`}
              >
                {codeCopied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Share options */}
          <div>
            <label className="block text-sm font-semibold mb-3">Share via</label>
            <div className="grid grid-cols-2 gap-2">
              {shareOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={opt.action}
                  className={`flex items-center gap-2.5 border rounded-xl px-3 py-3 text-sm font-medium transition-colors ${opt.color}`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Native share (mobile) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 bg-brand-orange/10 border border-brand-orange/30 text-brand-orange hover:bg-brand-orange/20 rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
            >
              <Share2 size={16} />
              Share via your device
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
