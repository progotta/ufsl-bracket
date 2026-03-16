'use client'

import { useState, useEffect } from 'react'
import { Share2, MessageSquare, Users, Copy, Check, X, Mail } from 'lucide-react'

interface InvitePanelProps {
  poolName: string
  inviteCode: string
  inviteUrl: string
}

interface ContactEntry {
  name: string
  email: string
  tel: string
}

export default function InvitePanel({ poolName, inviteCode, inviteUrl }: InvitePanelProps) {
  const [linkCopied, setLinkCopied] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [shareStatus, setShareStatus] = useState<string | null>(null)
  const [hasContactsApi, setHasContactsApi] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<ContactEntry[]>([])
  const [emailInput, setEmailInput] = useState('')
  const [sendStatus, setSendStatus] = useState<string | null>(null)

  // Detect Contacts API availability client-side only
  useEffect(() => {
    setHasContactsApi(
      typeof navigator !== 'undefined' &&
      'contacts' in navigator &&
      'ContactsManager' in window
    )
  }, [])

  const shareInvite = async () => {
    const text = `Join my ${poolName} bracket pool on UFSL!`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Join my UFSL Pool', text, url: inviteUrl })
      } catch {
        // user cancelled or share failed — fall through to clipboard
        await copyToClipboard(`${text} ${inviteUrl}`)
        setShareStatus('Link copied!')
        setTimeout(() => setShareStatus(null), 2500)
      }
    } else {
      await copyToClipboard(`${text} ${inviteUrl}`)
      setShareStatus('Link copied!')
      setTimeout(() => setShareStatus(null), 2500)
    }
  }

  const smsInvite = () => {
    const body = encodeURIComponent(`Join my ${poolName} bracket pool on UFSL! ${inviteUrl}`)
    // iOS uses sms:&body=  Android uses sms:?body=
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    const sep = isIOS ? '&' : '?'
    window.open(`sms:${sep}body=${body}`, '_self')
  }

  const pickContact = async () => {
    if (!hasContactsApi) return
    try {
      const contacts = await (navigator as any).contacts.select(['name', 'email', 'tel'], { multiple: true })
      if (!contacts || contacts.length === 0) return
      const parsed: ContactEntry[] = contacts.map((c: any) => ({
        name: (c.name && c.name[0]) || '',
        email: (c.email && c.email[0]) || '',
        tel: (c.tel && c.tel[0]) || '',
      }))
      setSelectedContacts(prev => {
        const existing = new Set(prev.map(x => x.email || x.tel))
        const deduped = parsed.filter(p => !existing.has(p.email || p.tel))
        return [...prev, ...deduped]
      })
    } catch {
      // user cancelled
    }
  }

  const removeContact = (idx: number) => {
    setSelectedContacts(prev => prev.filter((_, i) => i !== idx))
  }

  const copyLink = async () => {
    await copyToClipboard(inviteUrl)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const copyCode = async () => {
    await copyToClipboard(inviteCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const sendInvites = () => {
    const targets = [
      ...selectedContacts.filter(c => c.email).map(c => c.email),
    ]
    if (emailInput.trim()) targets.push(emailInput.trim())
    if (targets.length === 0) {
      setSendStatus('Add at least one email address')
      setTimeout(() => setSendStatus(null), 3000)
      return
    }
    const subject = encodeURIComponent(`Join ${poolName} on UFSL — March Madness Bracket Pool`)
    const body = encodeURIComponent(
      `Hey!\n\nJoin my March Madness bracket pool on UFSL!\n\nPool: ${poolName}\nJoin link: ${inviteUrl}\nOr use invite code: ${inviteCode}\n\nGood luck! 🏀`
    )
    window.open(`mailto:${targets.join(',')}?subject=${subject}&body=${body}`)
    setSelectedContacts([])
    setEmailInput('')
    setSendStatus('Email compose opened!')
    setTimeout(() => setSendStatus(null), 3000)
  }

  return (
    <div className="space-y-5">
      {/* Invite Code — prominent display */}
      <div>
        <h3 className="font-bold text-sm text-brand-muted uppercase tracking-wider mb-3">Invite Code</h3>
        <div className="bg-brand-card border border-brand-border rounded-xl flex items-center justify-between px-5 py-4">
          <div>
            <span
              className="text-3xl font-black tracking-[0.2em] text-brand-gold"
              data-testid="invite-code"
            >
              {inviteCode}
            </span>
            <p className="text-xs text-brand-muted mt-0.5">Share this code verbally or in a message</p>
          </div>
          <button
            onClick={copyCode}
            data-testid="copy-code-btn"
            className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              codeCopied
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-brand-surface border-brand-border hover:border-brand-orange text-white'
            }`}
          >
            {codeCopied ? <Check size={14} /> : <Copy size={14} />}
            {codeCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Share buttons */}
      <div>
        <h3 className="font-bold text-sm text-brand-muted uppercase tracking-wider mb-3">Share Invite</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Primary: Share Invite Link */}
          <button
            onClick={shareInvite}
            data-testid="share-invite-link-btn"
            className="flex items-center justify-center gap-2 bg-brand-orange/10 border border-brand-orange/30 text-brand-orange hover:bg-brand-orange/20 rounded-xl px-5 py-3 text-sm font-semibold transition-colors flex-1"
          >
            <Share2 size={16} />
            Share Invite Link
          </button>

          {/* Secondary: Invite via Text */}
          <button
            onClick={smsInvite}
            data-testid="invite-via-text-btn"
            className="flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 rounded-xl px-5 py-3 text-sm font-semibold transition-colors flex-1"
          >
            <MessageSquare size={16} />
            Invite via Text
          </button>

          {/* Contact Picker — Android Chrome only, hidden when API unavailable */}
          {hasContactsApi && (
            <button
              onClick={pickContact}
              data-testid="add-from-contacts-btn"
              className="flex items-center justify-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 rounded-xl px-5 py-3 text-sm font-semibold transition-colors flex-1"
            >
              <Users size={16} />
              Add from Contacts
            </button>
          )}
        </div>

        {/* Share status toast */}
        {shareStatus && (
          <p className="text-xs text-green-400 mt-2 pl-1">{shareStatus}</p>
        )}
      </div>

      {/* Copy invite link — secondary */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-brand-card border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-muted truncate">
          {inviteUrl}
        </div>
        <button
          onClick={copyLink}
          data-testid="copy-link-btn"
          className={`flex items-center gap-1.5 border rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
            linkCopied
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-brand-card border-brand-border hover:border-brand-orange text-white'
          }`}
        >
          {linkCopied ? <Check size={12} /> : <Copy size={12} />}
          {linkCopied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-brand-border" />
        <span className="text-xs text-brand-muted uppercase tracking-wider">or invite by email</span>
        <div className="flex-1 h-px bg-brand-border" />
      </div>

      {/* Manual email invite */}
      <div className="space-y-3">
        {/* Selected contacts chips */}
        {selectedContacts.length > 0 && (
          <div className="flex flex-wrap gap-2" data-testid="contact-chips">
            {selectedContacts.map((c, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 text-xs text-blue-300"
              >
                <span>{c.name || c.email || c.tel}</span>
                <button onClick={() => removeContact(idx)} className="hover:text-white transition-colors">
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="email"
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendInvites()}
            placeholder="friend@example.com"
            data-testid="email-input"
            className="flex-1 bg-brand-card border border-brand-border rounded-xl px-4 py-2.5 text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-orange transition-colors"
          />
          <button
            onClick={sendInvites}
            data-testid="send-invites-btn"
            className="flex items-center gap-2 bg-brand-orange/10 border border-brand-orange/30 text-brand-orange hover:bg-brand-orange/20 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap"
          >
            <Mail size={14} />
            Send
          </button>
        </div>

        {sendStatus && (
          <p className="text-xs text-green-400 pl-1">{sendStatus}</p>
        )}
      </div>
    </div>
  )
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    try { document.execCommand('copy') } catch { /* ignore */ }
    document.body.removeChild(ta)
  }
}
