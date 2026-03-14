# Auth Provider Credentials Needed

Once you provide these, HAL can activate each in ~5 minutes.

## Apple Sign In
**Cost:** Requires Apple Developer Program ($99/year)
**Time to set up:** ~20 minutes

1. Go to https://developer.apple.com → enroll in Developer Program if not already
2. Go to Identifiers → Register new App ID
   - Bundle ID: com.ufsl.bracket
   - Enable "Sign In with Apple" capability
3. Go to Identifiers → Register new Services ID
   - Description: UFSL Bracket Sign In
   - Identifier: com.ufsl.bracket.signin ← this is the client_id
   - Enable "Sign In with Apple" → Configure
   - Add domains: ufsl.net, ufsl-bracket.vercel.app
   - Add return URLs: https://szosapevsgegcgdifqhb.supabase.co/auth/v1/callback
4. Go to Keys → Create new key
   - Enable "Sign In with Apple" → Configure → select your App ID
   - Download the .p8 file (keep it safe!)
   - Note the Key ID

**Give HAL:**
- Services ID (client_id): com.ufsl.bracket.signin
- Team ID: (10-char code at top of developer.apple.com)
- Key ID: (10-char code shown when you created the key)
- Private key: (contents of the .p8 file you downloaded)

---

## Facebook Login
**Cost:** Free
**Time to set up:** ~15 minutes

1. Go to https://developers.facebook.com → My Apps → Create App
2. Select "Consumer" → Next
3. App name: "UFSL Bracket Challenge"
4. Add product: "Facebook Login" → Set Up → Web
5. Site URL: https://ufsl.net
6. Go to Facebook Login → Settings:
   - Valid OAuth Redirect URIs (add ALL of these):
     - https://szosapevsgegcgdifqhb.supabase.co/auth/v1/callback
     - https://ymzyzrfxgypfhbrqqaob.supabase.co/auth/v1/callback
7. Go to App Settings → Basic:
   - Note your App ID and App Secret

**Give HAL:**
- App ID: (number shown in App Settings)
- App Secret: (click Show in App Settings → Basic)

---

## Phone / SMS (Twilio)
**Cost:** ~$1/month for a number + ~$0.0075/SMS
**Time to set up:** ~10 minutes

1. Go to https://twilio.com → Sign up (free trial includes $15 credit)
2. Get a phone number (US number ~$1/mo)
3. Go to Console → Account → API keys & tokens
4. Note your Account SID and Auth Token

**Give HAL:**
- Account SID: (starts with AC...)
- Auth Token: (shown in Console dashboard)
- Phone number: (e.g., +13035551234)

---

## What's Already Working
- Google Sign In
- Email Magic Link
- Phone UI (just needs Twilio credentials to send real SMS)
