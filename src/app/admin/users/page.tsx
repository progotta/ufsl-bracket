import { createServerClient } from '@/lib/supabase/server'

export default async function AdminUsers() {
  const supabase = createServerClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('id, username, display_name, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Users ({users?.length ?? 0})</h1>
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border text-brand-muted text-xs uppercase">
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Username</th>
              <th className="text-left p-3">Joined</th>
              <th className="text-left p-3">ID</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-b border-brand-border/50 hover:bg-white/3">
                <td className="p-3 font-medium">{u.display_name || '—'}</td>
                <td className="p-3 text-brand-muted">{u.username || '—'}</td>
                <td className="p-3 text-brand-muted">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                <td className="p-3 text-brand-muted font-mono text-xs">{u.id.slice(0, 8)}…</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
