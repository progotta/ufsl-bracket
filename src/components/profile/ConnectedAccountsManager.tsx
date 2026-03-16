'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Mail,
  Phone,
  ArrowRight,
  Loader2,
  Trash2,
  Plus,
  CheckCircle,
  AlertTriangle,
  X,
  RefreshCw,
} from 'lucide-react'

interface Identity {
  id: string
  provider: string
  provider_id: string
  email?: string
  phone?: string
  created_at: string
}

type AddFlow = 'none' | 'email' | 'email-otp' | 'phone' | 'phone-otp'

const PROVIDER_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  email: {
    label: 'Email',
    color: 'text-blue-400',
    icon: <Mail size={18} className="text-blue-400" />,
  },
  phone: {
    label: 'Phone',
    color: 'text-green-400',
    icon: <Phone size={18} className="text-green-400" />,
  },
  google: {
    label: 'Google',
    color: 'text-red-400',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
  },
  apple: {
    label: 'Apple',
    color: 'text-white',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
      </svg>
    ),
  },
  facebook: {
    label: 'Facebook',
    color: 'text-[#1877F2]',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
}

function formatIdentityLabel(identity: Identity): string {
  if (identity.email) return identity.email
  if (identity.phone) return identity.phone
  if (identity.provider_id && identity.provider_id !== identity.id) {
    return identity.provider_id
  }
  return identity.provider
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ConnectedAccountsManager() {
  const supabase = createClient()
  const [identities, setIdentities] = useState<Identity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [flow, setFlow] = useState<AddFlow>('none')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [flowLoading, setFlowLoading] = useState(false)
  const [removingProvider, setRemovingProvider] = useState<string | null>(null)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  const fetchIdentities = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/profile/identities')
      if (!res.ok) throw new Error('Failed to load identities')
      const data = await res.json()
      setIdentities(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchIdentities()
  }, [fetchIdentities])

  useEffect(() => {
    if (resendCountdown <= 0) return
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCountdown])

  const linkedProviders = new Set(identities.map((i) => i.provider))

  // — Email flow —
  const handleSendEmailOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setFlowLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithOtp({ email: newEmail })
    setFlowLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setFlow('email-otp')
      setResendCountdown(60)
    }
  }

  const handleVerifyEmailOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setFlowLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.verifyOtp({
      email: newEmail,
      token: otp,
      type: 'email',
    })
    setFlowLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setSuccess(`Email ${newEmail} linked successfully!`)
      resetFlow()
      await fetchIdentities()
    }
  }

  // — Phone flow —
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length === 0) return ''
    if (digits.startsWith('1') && digits.length <= 11) {
      const rest = digits.slice(1)
      if (rest.length <= 3) return `+1 (${rest}`
      if (rest.length <= 6) return `+1 (${rest.slice(0, 3)}) ${rest.slice(3)}`
      return `+1 (${rest.slice(0, 3)}) ${rest.slice(3, 6)}-${rest.slice(6, 10)}`
    }
    if (digits.length <= 10) {
      if (digits.length <= 3) return `(${digits}`
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }
    return '+' + digits
  }

  const normalizePhone = (p: string) =>
    p.startsWith('+') ? p : `+1${p.replace(/\D/g, '')}`

  const handleSendPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setFlowLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithOtp({
      phone: normalizePhone(newPhone),
    })
    setFlowLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setFlow('phone-otp')
      setResendCountdown(60)
    }
  }

  const handleVerifyPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setFlowLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.verifyOtp({
      phone: normalizePhone(newPhone),
      token: otp,
      type: 'sms',
    })
    setFlowLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setSuccess(`Phone ${newPhone} linked successfully!`)
      resetFlow()
      await fetchIdentities()
    }
  }

  // — OAuth flow —
  const handleLinkOAuth = async (provider: 'google' | 'apple' | 'facebook') => {
    setOauthLoading(provider)
    setError(null)
    const { error: err } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/profile/accounts')}`,
      },
    })
    if (err) {
      setError(err.message)
      setOauthLoading(null)
    }
    // On success: redirect happens automatically
  }

  // — Remove identity —
  const handleRemove = async (provider: string) => {
    if (!confirm(`Remove ${PROVIDER_CONFIG[provider]?.label ?? provider} sign-in method?`)) return
    setRemovingProvider(provider)
    setError(null)
    try {
      const res = await fetch(`/api/profile/identities/${encodeURIComponent(provider)}`, {
        method: 'DELETE',
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error || 'Failed to remove')
      } else {
        setSuccess(`${PROVIDER_CONFIG[provider]?.label ?? provider} removed.`)
        await fetchIdentities()
      }
    } catch {
      setError('Failed to remove identity')
    } finally {
      setRemovingProvider(null)
    }
  }

  const resetFlow = () => {
    setFlow('none')
    setNewEmail('')
    setNewPhone('')
    setOtp('')
    setError(null)
  }

  // OAuth providers to potentially show
  const oauthProviders: Array<'google' | 'apple' | 'facebook'> = ['google', 'apple', 'facebook']
  // Show Apple/Facebook only if their env vars exist (client-side heuristic: always show Google)
  // In practice, linkIdentity will fail if the provider isn't enabled in Supabase
  const showOAuthProviders = oauthProviders.filter((p) => {
    if (p === 'google') return true
    // Show Apple/Facebook if not already linked (we can't check env vars client-side,
    // but they'll show a nice error if not configured in Supabase)
    return !linkedProviders.has(p)
  })

  const unlinkedOAuth = showOAuthProviders.filter((p) => !linkedProviders.has(p))

  return (
    <div className="space-y-6">
      {/* Success / global error */}
      {success && (
        <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 text-sm">
          <CheckCircle size={16} className="shrink-0 mt-0.5" />
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess(null)} className="shrink-0 hover:text-green-300">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Linked identities */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between">
          <h2 className="font-bold">Your Sign-In Methods</h2>
          <button
            onClick={fetchIdentities}
            disabled={loading}
            className="text-brand-muted hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-brand-muted">
            <Loader2 size={20} className="animate-spin mr-2" />
            Loading…
          </div>
        ) : identities.length === 0 ? (
          <div className="px-5 py-8 text-center text-brand-muted text-sm">
            No linked identities found.
          </div>
        ) : (
          <ul className="divide-y divide-brand-border">
            {identities.map((identity, idx) => {
              const config = PROVIDER_CONFIG[identity.provider]
              const label = formatIdentityLabel(identity)
              const canRemove = identities.length > 1
              return (
                <li key={identity.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="shrink-0">
                    {config?.icon ?? <Mail size={18} className="text-brand-muted" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {config?.label ?? identity.provider}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] bg-brand-orange/10 text-brand-orange border border-brand-orange/20 px-1.5 py-0.5 rounded-full font-medium">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-brand-muted truncate">{label}</div>
                    <div className="text-[10px] text-brand-muted/60 mt-0.5">
                      Linked {formatDate(identity.created_at)}
                    </div>
                  </div>
                  {canRemove && (
                    <button
                      onClick={() => handleRemove(identity.provider)}
                      disabled={removingProvider === identity.provider}
                      className="shrink-0 p-2 text-brand-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-40"
                      title={`Remove ${config?.label ?? identity.provider}`}
                    >
                      {removingProvider === identity.provider ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Add new identity */}
      {flow === 'none' && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-border">
            <h2 className="font-bold">Add Sign-In Method</h2>
            <p className="text-brand-muted text-xs mt-0.5">
              Link additional methods so you can always get back in.
            </p>
          </div>
          <div className="p-5 space-y-3">
            {/* Email */}
            {!linkedProviders.has('email') && (
              <button
                onClick={() => setFlow('email')}
                className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-brand-border rounded-xl px-4 py-3 text-sm font-medium transition-all text-left"
              >
                <Mail size={18} className="text-blue-400 shrink-0" />
                <div className="flex-1">
                  <div>Add Email</div>
                  <div className="text-xs text-brand-muted font-normal">Sign in with a one-time code</div>
                </div>
                <Plus size={16} className="text-brand-muted shrink-0" />
              </button>
            )}

            {/* Phone */}
            {!linkedProviders.has('phone') && (
              <button
                onClick={() => setFlow('phone')}
                className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-brand-border rounded-xl px-4 py-3 text-sm font-medium transition-all text-left"
              >
                <Phone size={18} className="text-green-400 shrink-0" />
                <div className="flex-1">
                  <div>Add Phone</div>
                  <div className="text-xs text-brand-muted font-normal">Sign in with a text message</div>
                </div>
                <Plus size={16} className="text-brand-muted shrink-0" />
              </button>
            )}

            {/* OAuth */}
            {unlinkedOAuth.map((provider) => {
              const config = PROVIDER_CONFIG[provider]
              return (
                <button
                  key={provider}
                  onClick={() => handleLinkOAuth(provider)}
                  disabled={oauthLoading === provider}
                  className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-brand-border rounded-xl px-4 py-3 text-sm font-medium transition-all text-left disabled:opacity-50"
                >
                  <span className="shrink-0">{config?.icon}</span>
                  <div className="flex-1">
                    <div>Connect {config?.label}</div>
                    <div className="text-xs text-brand-muted font-normal">
                      Sign in with {config?.label}
                    </div>
                  </div>
                  {oauthLoading === provider ? (
                    <Loader2 size={16} className="animate-spin text-brand-muted shrink-0" />
                  ) : (
                    <Plus size={16} className="text-brand-muted shrink-0" />
                  )}
                </button>
              )
            })}

            {/* Already linked everything */}
            {!linkedProviders.has('email') === false &&
              !linkedProviders.has('phone') === false &&
              unlinkedOAuth.length === 0 && (
                <p className="text-brand-muted text-sm text-center py-2">
                  All sign-in methods are linked. ✅
                </p>
              )}
          </div>
        </div>
      )}

      {/* Email flow */}
      {flow === 'email' && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Mail size={16} className="text-blue-400" /> Add Email
            </h3>
            <button onClick={resetFlow} className="text-brand-muted hover:text-white">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSendEmailOTP} className="space-y-4">
            <div>
              <label className="block text-sm text-brand-muted mb-1.5">
                Email address to link
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input-base"
                autoFocus
              />
            </div>
            {error && <ErrorMsg message={error} onDismiss={() => setError(null)} />}
            <button
              type="submit"
              disabled={flowLoading || !newEmail}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {flowLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>Send Code <ArrowRight size={14} /></>
              )}
            </button>
          </form>
        </div>
      )}

      {flow === 'email-otp' && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <CheckCircle size={16} className="text-brand-orange" /> Check your email
            </h3>
            <button onClick={resetFlow} className="text-brand-muted hover:text-white">
              <X size={16} />
            </button>
          </div>
          <p className="text-brand-muted text-sm">
            We sent an 8-character code to <strong className="text-white">{newEmail}</strong>.
            Check your spam if you don&apos;t see it.
          </p>
          <form onSubmit={handleVerifyEmailOTP} className="space-y-4">
            <div>
              <label className="block text-sm text-brand-muted mb-1.5">Verification code</label>
              <input
                type="text"
                inputMode="text"
                maxLength={8}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\s/g, ''))}
                placeholder="00000000"
                required
                className="input-base text-center text-2xl tracking-widest font-mono"
                autoFocus
              />
            </div>
            {error && <ErrorMsg message={error} onDismiss={() => setError(null)} />}
            <button
              type="submit"
              disabled={flowLoading || otp.length < 6}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {flowLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>Verify & Link <ArrowRight size={14} /></>
              )}
            </button>
            <button
              type="button"
              disabled={resendCountdown > 0}
              onClick={async () => {
                const { error: err } = await supabase.auth.signInWithOtp({ email: newEmail })
                if (err) setError(err.message)
                else setResendCountdown(60)
              }}
              className="text-brand-muted text-sm text-center w-full hover:text-white transition-colors disabled:opacity-40"
            >
              {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
            </button>
          </form>
        </div>
      )}

      {/* Phone flow */}
      {flow === 'phone' && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Phone size={16} className="text-green-400" /> Add Phone
            </h3>
            <button onClick={resetFlow} className="text-brand-muted hover:text-white">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSendPhoneOTP} className="space-y-4">
            <div>
              <label className="block text-sm text-brand-muted mb-1.5">
                Phone number to link
              </label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(formatPhone(e.target.value))}
                placeholder="(555) 000-0000"
                required
                className="input-base"
                autoFocus
              />
              <p className="text-white/30 text-xs mt-1">Powered by Twilio</p>
            </div>
            {error && <ErrorMsg message={error} onDismiss={() => setError(null)} />}
            <button
              type="submit"
              disabled={flowLoading || !newPhone}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {flowLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>Send Code <ArrowRight size={14} /></>
              )}
            </button>
          </form>
        </div>
      )}

      {flow === 'phone-otp' && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <CheckCircle size={16} className="text-brand-orange" /> Check your phone
            </h3>
            <button onClick={resetFlow} className="text-brand-muted hover:text-white">
              <X size={16} />
            </button>
          </div>
          <p className="text-brand-muted text-sm">
            We texted a 6-digit code to <strong className="text-white">{newPhone}</strong>.
          </p>
          <form onSubmit={handleVerifyPhoneOTP} className="space-y-4">
            <div>
              <label className="block text-sm text-brand-muted mb-1.5">Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                required
                className="input-base text-center text-2xl tracking-widest font-mono"
                autoFocus
              />
            </div>
            {error && <ErrorMsg message={error} onDismiss={() => setError(null)} />}
            <button
              type="submit"
              disabled={flowLoading || otp.length < 6}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {flowLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>Verify & Link <ArrowRight size={14} /></>
              )}
            </button>
            <button
              type="button"
              disabled={resendCountdown > 0}
              onClick={async () => {
                const { error: err } = await supabase.auth.signInWithOtp({
                  phone: normalizePhone(newPhone),
                })
                if (err) setError(err.message)
                else setResendCountdown(60)
              }}
              className="text-brand-muted text-sm text-center w-full hover:text-white transition-colors disabled:opacity-40"
            >
              {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
            </button>
          </form>
        </div>
      )}

      {/* Safety note */}
      {flow === 'none' && (
        <div className="flex items-start gap-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 text-xs text-yellow-400/70">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>
            Always keep at least one sign-in method linked. If you remove a method, make sure
            you have another way to get back in.
          </span>
        </div>
      )}
    </div>
  )
}

function ErrorMsg({
  message,
  onDismiss,
}: {
  message: string
  onDismiss: () => void
}) {
  return (
    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="shrink-0 hover:text-red-300">
        <X size={14} />
      </button>
    </div>
  )
}
