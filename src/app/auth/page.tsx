import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import AuthForm from '@/components/auth/AuthForm'
import Logo from '@/components/ui/Logo'

export default async function AuthPage({
  searchParams,
}: {
  searchParams: { mode?: string; error?: string }
}) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect(searchParams.mode === 'commissioner' ? '/pools/create' : '/dashboard')
  }

  const isCommissioner = searchParams.mode === 'commissioner'

  return (
    <main className="min-h-screen bg-court-gradient flex flex-col items-center justify-center p-4">
      {/* Background pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-orange/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-brand-gold/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size="lg" />
          <p className="text-white/60 mt-3 text-sm">
            {isCommissioner ? 'Start your pool in minutes.' : 'Pick your bracket. Beat your friends.'}
          </p>
        </div>

        {/* Auth form */}
        <AuthForm
          commissionerMode={isCommissioner}
        />

        <p className="text-center text-white/50 text-xs mt-6">
          By signing in, you agree to our{' '}
          <a href="/terms" className="text-brand-orange hover:underline">Terms</a>{' '}
          and{' '}
          <a href="/privacy" className="text-brand-orange hover:underline">Privacy Policy</a>
        </p>
      </div>
    </main>
  )
}
