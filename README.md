# UFSL Bracket Challenge

🏀 March Madness bracket pool for [UFSL.net](https://ufsl.net)

Built with Next.js 14, Supabase, Tailwind CSS.

## Quick Start

### 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor → paste and run `supabase/migrations/001_initial_schema.sql`
3. Enable Auth providers:
   - Go to Authentication → Providers
   - Enable **Google**, **Apple**, **Facebook** (OAuth)
   - Enable **Email** (for magic link / OTP) — already on by default
   - Enable **Phone** (for SMS OTP via Twilio) — needs Twilio credentials:
     - Twilio Account SID
     - Twilio Auth Token
     - Twilio Phone Number

### 2. Configure OAuth Providers

For Google:
- Go to [console.cloud.google.com](https://console.cloud.google.com)
- Create OAuth 2.0 credentials
- Authorized redirect URIs: `https://[your-project].supabase.co/auth/v1/callback`
- Paste Client ID + Secret into Supabase → Authentication → Providers → Google

For Apple:
- Go to Apple Developer → Certificates, Identifiers & Profiles
- Create a Service ID and enable Sign In with Apple
- Paste credentials into Supabase → Apple

For Facebook:
- Create a Facebook App at [developers.facebook.com](https://developers.facebook.com)
- Add Facebook Login product
- Paste App ID + Secret into Supabase → Facebook

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 4. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

```bash
npx vercel --prod
```

Add environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (set to your Vercel URL or custom domain)

Also update Supabase:
- Authentication → URL Configuration → Site URL → your Vercel URL
- Additional Redirect URLs → `https://your-vercel-url.vercel.app/**`

## Project Structure

```
src/
  app/
    page.tsx              # Landing page
    auth/
      page.tsx            # Sign in
      callback/route.ts   # OAuth callback
    dashboard/
      page.tsx            # Main dashboard
    pools/
      new/page.tsx        # Create pool
      [id]/page.tsx       # Pool detail + leaderboard
      [id]/bracket/new/   # Create bracket (redirects to editor)
    brackets/
      [bracketId]/page.tsx # Bracket picker/viewer
    join/
      page.tsx            # Join by code form
      [code]/page.tsx     # Join specific pool
    profile/
      page.tsx            # User profile

  components/
    auth/AuthForm.tsx      # Login form with all providers
    bracket/BracketPicker.tsx  # Visual bracket picker UI
    layout/Nav.tsx         # Top navigation
    pools/
      Leaderboard.tsx      # Rankings table
      InviteButton.tsx     # Copy/share invite
      JoinPoolForm.tsx     # Join confirmation
      JoinByCodeForm.tsx   # Enter invite code
    profile/ProfileForm.tsx
    ui/Logo.tsx

  lib/
    supabase/             # Supabase clients (client/server/route)
    bracket.ts            # Bracket data structures + utilities

  types/
    database.ts           # TypeScript types from Supabase schema
```

## Bracket Data

Until Selection Sunday (March 16):
- The app uses **mock/placeholder teams** from `src/lib/bracket.ts`
- On Selection Sunday, update the teams in Supabase via the `teams` table
- The bracket picker will automatically use real data once 64 teams are in the DB

## Scoring

| Round | Points |
|-------|--------|
| Round of 64 | 1 |
| Round of 32 | 2 |
| Sweet 16 | 4 |
| Elite 8 | 8 |
| Final Four | 16 |
| Championship | 32 |
| **Total Max** | **192** |

## Features

- ✅ Auth: Google, Apple, Facebook OAuth + Email OTP + SMS OTP
- ✅ User profiles with display name + avatar
- ✅ Create pool with invite link/code
- ✅ Join pool via invite link or code
- ✅ Visual bracket picker (64 teams, 63 games)
- ✅ Save + submit bracket
- ✅ Leaderboard within pool
- ✅ Dark basketball theme
- ✅ Mobile responsive
- ✅ Auto-create profile on signup

## Performance & Caching

### Upstash Redis (optional but recommended)

Redis caching reduces Supabase load for leaderboards, live scores, and team data. Without it, caching is in-memory only (per serverless instance — each cold start misses).

1. Create a free database at [upstash.com](https://upstash.com) → Redis
2. Copy the REST URL and token
3. Add to `.env.local`:
   ```
   UPSTASH_REDIS_REST_URL=https://...upstash.io
   UPSTASH_REDIS_REST_TOKEN=AX...
   ```

**Cache TTLs:**
| Data | TTL |
|------|-----|
| Live scores (active games) | 30 seconds |
| Live scores (no games) | 5 minutes |
| Leaderboards | 60 seconds |
| Team data | 1 hour |

Cache is invalidated automatically when scores are updated via `/api/scores/update`.

Monitor cache health at `/api/admin/cache-stats` (commissioners only).

### Supabase Connection Pooling

For production serverless deployments, use the Supabase connection pooler (PgBouncer) to avoid exhausting Postgres connections:

1. Dashboard → Settings → Database → Connection pooling → copy the URI (port 6543)
2. Add to `.env.local`:
   ```
   SUPABASE_DB_URL=postgresql://postgres.[ref]:[pass]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

See `src/lib/supabase/config.ts` for details.

## Roadmap / Future Features

- [ ] Real-time score updates (Supabase Realtime)
- [ ] Commissioner tools (set game results)
- [ ] Multiple brackets per pool
- [ ] Email/push notifications for score updates
- [ ] Public pool discovery
- [ ] Tiebreaker picks
- [ ] Mobile app (React Native)
