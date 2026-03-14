/**
 * Email utility for UFSL Bracket Challenge.
 * Uses Resend when RESEND_API_KEY is configured, otherwise logs to console.
 */

interface InviteEmailParams {
  to: string
  poolName: string
  inviteUrl: string
  inviterName?: string
}

export async function sendInviteEmail({ to, poolName, inviteUrl, inviterName }: InviteEmailParams) {
  const apiKey = process.env.RESEND_API_KEY

  const subject = inviterName
    ? `${inviterName} invited you to ${poolName}`
    : `You're invited to join ${poolName}`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #111; color: #fff; border-radius: 16px;">
      <h1 style="font-size: 24px; margin: 0 0 8px;">UFSL Bracket Challenge</h1>
      <p style="color: #999; margin: 0 0 24px;">March Madness bracket pool</p>
      <p style="font-size: 16px; line-height: 1.6;">
        ${inviterName ? `<strong>${inviterName}</strong> invited you to join` : 'You\'ve been invited to join'}
        <strong style="color: #f97316;"> ${poolName}</strong>!
      </p>
      <a href="${inviteUrl}" style="display: inline-block; background: #f97316; color: #000; font-weight: 700; padding: 12px 28px; border-radius: 12px; text-decoration: none; margin: 24px 0;">
        Join Pool
      </a>
      <p style="color: #666; font-size: 12px; margin-top: 32px;">
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>
  `

  if (!apiKey) {
    console.log('[email] RESEND_API_KEY not configured — logging email instead of sending')
    console.log(`[email] To: ${to} | Subject: ${subject}`)
    console.log(`[email] Invite URL: ${inviteUrl}`)
    return { success: true, mode: 'logged' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'UFSL Bracket <noreply@ufsl.net>',
        to,
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('[email] Resend error:', error)
      return { success: false, error }
    }

    const data = await res.json()
    return { success: true, mode: 'sent', id: data.id }
  } catch (err) {
    console.error('[email] Failed to send:', err)
    return { success: false, error: String(err) }
  }
}
