// Resend email delivery — gracefully no-ops if RESEND_API_KEY not set
export async function deliverEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return // not configured yet

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'UFSL <notifications@ufsl.net>',
        to,
        subject,
        html,
      }),
    })
  } catch { /* silently fail */ }
}
