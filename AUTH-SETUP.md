# Auth Provider Setup

## Currently Working
- Google OAuth
- Email OTP (magic link)
- Phone OTP (SMS — requires Twilio in production)

## Needs Credentials from Shawn

### Apple Sign In
1. Go to: https://developer.apple.com
2. Create an App ID with Sign In with Apple capability
3. Create a Service ID (this is the client_id)
4. Create a Sign In with Apple private key (.p8 file)
5. Provide to HAL:
   - Service ID (e.g., com.ufsl.app.signin)
   - Team ID (10-char code on developer.apple.com)
   - Key ID (10-char code)
   - Private key content (.p8 file contents)

### Facebook Sign In
1. Go to: https://developers.facebook.com
2. Create an app → select "Consumer"
3. Add "Facebook Login" product
4. Set Valid OAuth Redirect URI to:
   - Test: `https://ymzyzrfxgypfhbrqqaob.supabase.co/auth/v1/callback`
   - Prod: `https://szosapevsgegcgdifqhb.supabase.co/auth/v1/callback`
5. Provide to HAL:
   - App ID
   - App Secret

### Twilio SMS (for phone auth in production)
1. Go to: https://twilio.com, create account
2. Get a phone number
3. Provide to HAL:
   - Account SID
   - Auth Token
   - Phone number
   - Twilio Verify Service SID (or Messaging Service SID)
