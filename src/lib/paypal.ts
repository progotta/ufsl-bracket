export const PAYPAL_CONFIGURED = !!(
  process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
)

const PAYPAL_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

export async function getPayPalAccessToken(): Promise<string | null> {
  if (!PAYPAL_CONFIGURED) return null
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64')
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token || null
}

export { PAYPAL_BASE }

export async function createPayPalOrder(
  amount: number,
  currency: string = 'USD',
  merchantId: string,
  metadata: { pool_id: string; user_id: string }
): Promise<{ id: string } | null> {
  const token = await getPayPalAccessToken()
  if (!token) return null

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Partner-Attribution-Id': process.env.PAYPAL_BN_CODE || '',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: currency, value: amount.toFixed(2) },
        payee: { merchant_id: merchantId },
        custom_id: JSON.stringify(metadata),
      }],
    }),
  })
  return res.ok ? res.json() : null
}

export async function capturePayPalOrder(orderId: string): Promise<any> {
  const token = await getPayPalAccessToken()
  if (!token) return null
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  return res.ok ? res.json() : null
}

export async function verifyPayPalWebhook(
  headers: Record<string, string>,
  body: string,
  webhookId: string
): Promise<boolean> {
  const token = await getPayPalAccessToken()
  if (!token) return false
  const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: JSON.parse(body),
    }),
  })
  const data = await res.json()
  return data.verification_status === 'SUCCESS'
}
