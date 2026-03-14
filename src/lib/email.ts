/**
 * Email utility for UFSL Bracket Challenge.
 * Uses Resend when RESEND_API_KEY is configured, otherwise logs to console.
 */

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[email stub]', { to, subject, text })
    return { success: true, stub: true }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'UFSL Bracket <noreply@ufsl.net>',
        to,
        subject,
        html,
        text,
      }),
    })
    if (!res.ok) {
      const error = await res.text()
      console.error('[email] Resend error:', error)
      return { success: false, error }
    }
    return { success: true }
  } catch (err) {
    console.error('[email] Failed to send:', err)
    return { success: false, error: String(err) }
  }
}

export async function sendInviteEmail(
  to: string,
  poolName: string,
  inviteUrl: string,
  commissionerName: string
) {
  return sendEmail({
    to,
    subject: `${commissionerName} invited you to ${poolName} on UFSL Bracket`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #111; color: #fff; border-radius: 16px;">
        <h2 style="margin: 0 0 16px;">🏀 You're invited!</h2>
        <p style="font-size: 16px; line-height: 1.6;">
          <strong>${commissionerName}</strong> invited you to join <strong style="color: #f97316;">${poolName}</strong> on UFSL Bracket.
        </p>
        <a href="${inviteUrl}" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:24px 0;">
          Join the Pool →
        </a>
        <p style="color:#666;font-size:12px;margin-top:24px;">
          No account needed — click the link and you're in within a minute.
        </p>
      </div>
    `,
    text: `${commissionerName} invited you to ${poolName} on UFSL Bracket. Join here: ${inviteUrl}`,
  })
}

export async function sendPaymentReminderEmail(
  to: string,
  poolName: string,
  amount: number,
  paymentInstructions: string,
  poolUrl: string
) {
  return sendEmail({
    to,
    subject: `Entry fee reminder — ${poolName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #111; color: #fff; border-radius: 16px;">
        <h2 style="margin: 0 0 16px;">💰 Entry fee due</h2>
        <p style="font-size: 16px; line-height: 1.6;">Your $${amount} entry fee for <strong style="color: #f97316;">${poolName}</strong> is still outstanding.</p>
        <p style="color:#ccc;font-size:14px;">${paymentInstructions}</p>
        <a href="${poolUrl}" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:24px 0;">
          View Pool →
        </a>
      </div>
    `,
    text: `Entry fee reminder for ${poolName}: $${amount} due. ${paymentInstructions}`,
  })
}

export async function sendBracketReminderEmail(
  to: string,
  poolName: string,
  bracketUrl: string
) {
  return sendEmail({
    to,
    subject: `⏰ Submit your bracket — ${poolName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #111; color: #fff; border-radius: 16px;">
        <h2 style="margin: 0 0 16px;">⏰ Deadline approaching!</h2>
        <p style="font-size: 16px; line-height: 1.6;">You haven't submitted your bracket for <strong style="color: #f97316;">${poolName}</strong> yet. Don't miss the deadline!</p>
        <a href="${bracketUrl}" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:24px 0;">
          Submit Bracket →
        </a>
      </div>
    `,
    text: `Submit your bracket for ${poolName} before picks lock! ${bracketUrl}`,
  })
}
