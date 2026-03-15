// Twilio SMS delivery — gracefully no-ops if credentials not set
export async function deliverSms(to: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER
  if (!accountSid || !authToken || !fromNumber || !to) return // not configured yet

  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ From: fromNumber, To: to, Body: body }).toString(),
    })
  } catch { /* silently fail */ }
}
