import { createServerClient } from '@/lib/supabase/server'

export default async function AdminPools() {
  const supabase = createServerClient()
  const { data: pools } = await supabase
    .from('pools')
    .select(`
      id, name, invite_code, created_at,
      commissioner:profiles!pools_commissioner_id_fkey(display_name, username),
      pool_members(count)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Pools ({pools?.length ?? 0})</h1>
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border text-brand-muted text-xs uppercase">
              <th className="text-left p-3">Pool</th>
              <th className="text-left p-3">Commissioner</th>
              <th className="text-left p-3">Members</th>
              <th className="text-left p-3">Invite Code</th>
              <th className="text-left p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {pools?.map((p) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const comm = p.commissioner as any
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const memberCount = (p.pool_members as any)?.[0]?.count ?? 0
              return (
                <tr key={p.id} className="border-b border-brand-border/50 hover:bg-white/3">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-brand-muted">{comm?.display_name || comm?.username || '—'}</td>
                  <td className="p-3">{memberCount}</td>
                  <td className="p-3 font-mono text-brand-muted">{p.invite_code}</td>
                  <td className="p-3 text-brand-muted">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
