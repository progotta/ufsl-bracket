import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MOCK_TEAMS } from '@/lib/bracket'

interface Props {
  params: { id: string }
}

export default async function NewBracketPage({ params }: Props) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth')

  // Check pool exists and user is a member
  const { data: pool } = await supabase
    .from('pools')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!pool) redirect('/dashboard')

  const { data: membership } = await supabase
    .from('pool_members')
    .select('id')
    .eq('pool_id', params.id)
    .eq('user_id', session.user.id)
    .single()

  if (!membership) redirect(`/pools/${params.id}`)

  // Check if bracket already exists
  const { data: existing } = await supabase
    .from('brackets')
    .select('id')
    .eq('pool_id', params.id)
    .eq('user_id', session.user.id)
    .single()

  if (existing) {
    redirect(`/brackets/${existing.id}`)
  }

  // Create the bracket
  const { data: bracket, error } = await supabase
    .from('brackets')
    .insert({
      pool_id: params.id,
      user_id: session.user.id,
      name: 'My Bracket',
      picks: {},
      is_submitted: false,
      score: 0,
      max_possible_score: 192,
    })
    .select()
    .single()

  if (error || !bracket) {
    redirect(`/pools/${params.id}`)
  }

  redirect(`/brackets/${bracket.id}`)
}
