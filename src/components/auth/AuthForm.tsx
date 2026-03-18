'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Phone, ArrowRight, Loader2, CheckCircle, X } from 'lucide-react'
import clsx from 'clsx'

type AuthStep = 'choose' | 'email' | 'phone' | 'otp-email' | 'otp-phone'
type LoadingProvider = 'apple' | 'google' | 'facebook' | 'email' | 'phone' | 'verify' | null

export default function AuthForm({ commissionerMode = false }: { commissionerMode?: boolean }) {
  const router = useRouter()
  const [step, setStep] = useState<AuthStep>('choose')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState<LoadingProvider>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [resendCountdown, setResendCountdown] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCountdown])

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

  const postAuthRedirect = commissionerMode ? '/pools/create' : '/dashboard'

  const handleOAuthLogin = async (provider: 'google' | 'apple' | 'facebook') => {
    setLoading(provider)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(postAuthRedirect)}`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(null)
    }
  }

  const handleEmailOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading('email')
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
    })
    if (error) {
      setError(error.message)
    } else {
      setStep('otp-email')
      setSuccess(`We sent a code to ${email}`)
      setResendCountdown(60)
    }
    setLoading(null)
  }

  const handlePhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading('phone')
    setError(null)
    const formatted = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`
    const { error } = await supabase.auth.signInWithOtp({
      phone: formatted,
    })
    if (error) {
      setError(error.message)
    } else {
      setStep('otp-phone')
      setSuccess(`We sent a code to ${formatted}`)
      setResendCountdown(60)
    }
    setLoading(null)
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading('verify')
    setError(null)

    let verifyError
    if (step === 'otp-email') {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
      verifyError = error
    } else {
      const formatted = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`
      const { error } = await supabase.auth.verifyOtp({ phone: formatted, token: otp, type: 'sms' })
      verifyError = error
    }

    if (verifyError) {
      setError(verifyError.message)
      setLoading(null)
    } else {
      // Explicit redirect — don't rely solely on auth state change
      router.push(postAuthRedirect)
      router.refresh()
    }
  }

  const isDisabled = loading !== null

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 shadow-2xl animate-fade-in w-full max-w-md mx-auto">
      {step === 'choose' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-center">{commissionerMode ? 'Start your pool' : 'Sign In'}</h1>
          <p className="text-white/50 text-sm text-center -mt-3">{commissionerMode ? 'Sign in to create your bracket pool' : 'Sign in or create your free account'}</p>

          {/* OAuth Buttons — Apple and Facebook hidden until configured */}
          <div className="space-y-3">
            <OAuthButton
              provider="google"
              onClick={() => handleOAuthLogin('google')}
              disabled={isDisabled}
              loading={loading === 'google'}
            />
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-brand-surface px-3 text-white/50">or continue with</span>
            </div>
          </div>

          {/* Email / Phone */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setStep('email')}
              disabled={isDisabled}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-brand-border rounded-lg py-3 px-4 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Mail size={16} className="text-brand-orange" />
              Email
            </button>
            <button
              onClick={() => setStep('phone')}
              disabled={isDisabled}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-brand-border rounded-lg py-3 px-4 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Phone size={16} className="text-brand-orange" />
              Phone
            </button>
          </div>

          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
        </div>
      )}

      {step === 'email' && (
        <form onSubmit={handleEmailOTP} className="space-y-5 animate-fade-in">
          <BackButton onClick={() => { setStep('choose'); setError(null) }} />
          <h2 className="text-xl font-bold">Enter your email</h2>
          <p className="text-brand-muted text-sm">We&apos;ll send you a one-time code to sign in.</p>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="input-base"
            autoFocus
          />
          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
          <button type="submit" disabled={isDisabled || !email} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading === 'email' ? <Loader2 size={18} className="animate-spin" /> : <><span>Send Code</span><ArrowRight size={16} /></>}
          </button>
        </form>
      )}

      {step === 'phone' && (
        <form onSubmit={handlePhoneOTP} className="space-y-5 animate-fade-in">
          <BackButton onClick={() => { setStep('choose'); setError(null) }} />
          <h2 className="text-xl font-bold">Enter your phone number</h2>
          <p className="text-brand-muted text-sm">We&apos;ll text you a one-time code to sign in.</p>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(formatPhone(e.target.value))}
            placeholder="(555) 000-0000"
            required
            className="input-base"
            autoFocus
          />
          <p className="text-white/30 text-xs">Powered by Twilio</p>
          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
          <button type="submit" disabled={isDisabled || !phone} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading === 'phone' ? <Loader2 size={18} className="animate-spin" /> : <><span>Send Code</span><ArrowRight size={16} /></>}
          </button>
        </form>
      )}

      {(step === 'otp-email' || step === 'otp-phone') && (
        <form onSubmit={handleVerifyOTP} className="space-y-5 animate-fade-in">
          <BackButton onClick={() => { setStep(step === 'otp-email' ? 'email' : 'phone'); setError(null); setOtp('') }} />
          <div className="text-center">
            <CheckCircle size={40} className="text-brand-orange mx-auto mb-3" />
            <h2 className="text-xl font-bold">Check your {step === 'otp-email' ? 'email' : 'phone'}</h2>
            {success && <p className="text-brand-muted text-sm mt-1">{success}</p>}
            {step === 'otp-email' && (
              <p className="text-white/30 text-xs mt-2">Check spam if you don&apos;t see it within 1 minute</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-brand-muted">Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\s/g, ''))}
              placeholder={step === 'otp-phone' ? '000000' : '00000000'}
              required
              className="input-base text-center text-2xl tracking-widest font-mono"
              autoFocus
            />
          </div>
          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
          <button type="submit" disabled={isDisabled || otp.length < 6} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading === 'verify' ? <Loader2 size={18} className="animate-spin" /> : <><span>Verify Code</span><ArrowRight size={16} /></>}
          </button>
          <button
            type="button"
            disabled={resendCountdown > 0}
            onClick={async () => {
              setError(null)
              if (step === 'otp-email') {
                const { error } = await supabase.auth.signInWithOtp({
                  email,
                  options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
                })
                if (error) setError(error.message)
                else { setSuccess(`New code sent to ${email}`); setResendCountdown(60) }
              } else {
                const formatted = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`
                const { error } = await supabase.auth.signInWithOtp({ phone: formatted })
                if (error) setError(error.message)
                else { setSuccess(`New code sent to ${formatted}`); setResendCountdown(60) }
              }
            }}
            className="text-brand-muted text-sm text-center w-full hover:text-white transition-colors disabled:opacity-50 disabled:hover:text-brand-muted"
          >
            {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend code'}
          </button>
        </form>
      )}
    </div>
  )
}

function OAuthButton({
  provider,
  onClick,
  disabled,
  loading,
}: {
  provider: 'google' | 'apple' | 'facebook'
  onClick: () => void
  disabled: boolean
  loading: boolean
}) {
  const config = {
    google: {
      label: 'Continue with Google',
      bg: 'bg-white/5 hover:bg-white/10',
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
      label: 'Continue with Apple',
      bg: 'bg-white/5 hover:bg-white/10',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
        </svg>
      ),
    },
    facebook: {
      label: 'Continue with Facebook',
      bg: 'bg-white/5 hover:bg-[#1877F2]/10',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
  }

  const c = config[provider]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'w-full flex items-center justify-center gap-3 border border-brand-border rounded-lg py-3 px-4 text-sm font-medium transition-all active:scale-95 disabled:opacity-50',
        c.bg
      )}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        c.icon
      )}
      {c.label}
    </button>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-brand-muted text-sm hover:text-white transition-colors flex items-center gap-1"
    >
      ← Back
    </button>
  )
}

function ErrorMessage({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 flex items-start justify-between gap-2">
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="text-red-400 hover:text-red-300 transition-colors shrink-0 mt-0.5"
      >
        <X size={14} />
      </button>
    </div>
  )
}
