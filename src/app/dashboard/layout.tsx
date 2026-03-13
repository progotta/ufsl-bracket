import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Nav from '@/components/layout/Nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) redirect('/auth')

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    return (
      <div className="min-h-screen bg-brand-dark">
        <Nav profile={profile} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
      </div>
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack?.split('\n').slice(0, 6).join('\n') : ''
    return (
      <div className="min-h-screen bg-brand-dark p-8">
        <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-8 max-w-2xl">
          <h2 className="text-red-400 font-bold text-lg mb-2">Layout Error (debug)</h2>
          <pre className="text-red-300 text-xs whitespace-pre-wrap">{msg}</pre>
          <pre className="text-red-300/60 text-xs whitespace-pre-wrap mt-2">{stack}</pre>
        </div>
      </div>
    )
  }
}
