import { createRouteClient } from '@/lib/supabase/route'
import { createReadClient } from '@/lib/supabase/server'
import { notify } from '@/lib/notify'
import { sendBracketReminderEmail, sendPaymentReminderEmail } from '@/lib/email'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminDb = createReadClient()

  // Verify commissioner
  const { data: pool } = await adminDb
    .from('pools')
    .select('commissioner_id, name, entry_fee')
    .eq('id', params.id)
    .single()

  if (!pool || pool.commissioner_id !== session.user.id) {
    return NextResponse.json({ error: 'Only the commissioner can send reminders' }, { status: 403 })
  }

  const { type } = await req.json()

  if (type === 'submit') {
    // Find members without submitted brackets
    const { data: members } = await adminDb
      .from('pool_members')
      .select('user_id')
      .eq('pool_id', params.id)

    const { data: brackets } = await adminDb
      .from('brackets')
      .select('user_id')
      .eq('pool_id', params.id)
      .eq('is_submitted', true)

    const submittedUserIds = new Set(brackets?.map(b => b.user_id) || [])
    const needsReminder = members?.filter(
      m => !submittedUserIds.has(m.user_id) && m.user_id !== session.user.id
    ) || []

    for (const member of needsReminder) {
      await notify(member.user_id, {
        pool_id: params.id,
        type: 'pick_reminder',
        title: '⏰ Deadline approaching!',
        message: `${pool.name}: Submit your bracket before picks lock`,
        action_url: `/brackets/new?pool=${params.id}`,
      })

      // Also email if they have an email address
      const { data: profile } = await adminDb
        .from('profiles')
        .select('email')
        .eq('id', member.user_id)
        .single()

      if (profile?.email) {
        sendBracketReminderEmail(
          profile.email,
          pool.name,
          `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ufsl-bracket.vercel.app'}/brackets/new?pool=${params.id}`
        ).catch(err => console.error('[email] bracket reminder failed:', err))
      }
    }

    return NextResponse.json({ sent: needsReminder.length })
  }

  if (type === 'pay') {
    const entryFee = Number(pool.entry_fee) || 0
    const { data: unpaid } = await adminDb
      .from('pool_members')
      .select('user_id')
      .eq('pool_id', params.id)
      .eq('payment_status', 'unpaid')
      .neq('user_id', session.user.id)

    const needsReminder = unpaid || []

    for (const member of needsReminder) {
      await notify(member.user_id, {
        pool_id: params.id,
        type: 'payment_reminder',
        title: '💸 Entry fee due',
        message: `${pool.name}: $${entryFee} entry fee is still owed`,
        action_url: `/pools/${params.id}`,
      })

      // Also email if they have an email address
      const { data: profile } = await adminDb
        .from('profiles')
        .select('email')
        .eq('id', member.user_id)
        .single()

      if (profile?.email) {
        sendPaymentReminderEmail(
          profile.email,
          pool.name,
          entryFee,
          'Contact the commissioner for payment details.',
          `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ufsl-bracket.vercel.app'}/pools/${params.id}`
        ).catch(err => console.error('[email] payment reminder failed:', err))
      }
    }

    return NextResponse.json({ sent: needsReminder.length })
  }

  return NextResponse.json({ error: 'Invalid reminder type' }, { status: 400 })
}
