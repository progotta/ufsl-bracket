import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

  // Check how many brackets this user already has in this pool
  const { data: existingBrackets, count: bracketCount } = await supabase
    .from('brackets')
    .select('id', { count: 'exact' })
    .eq('pool_id', params.id)
    .eq('user_id', session.user.id)

  const maxBrackets = (pool as any).max_brackets_per_member || 1

  // If single-bracket pool and bracket exists, redirect to it
  if (maxBrackets === 1 && existingBrackets && existingBrackets.length > 0) {
    redirect(`/brackets/${existingBrackets[0].id}`)
  }

  // Enforce max brackets limit
  if (bracketCount !== null && bracketCount >= maxBrackets) {
    // Redirect to pool page — they've hit the limit
    redirect(`/pools/${params.id}?error=max_brackets`)
  }

  // Determine bracket name
  const bracketNumber = (bracketCount || 0) + 1
  const bracketName = bracketNumber === 1 ? 'My Bracket' : `Bracket ${bracketNumber}`

  // Create the bracket
  const { data: bracket, error } = await supabase
    .from('brackets')
    .insert({
      pool_id: params.id,
      user_id: session.user.id,
      name: bracketName,
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
