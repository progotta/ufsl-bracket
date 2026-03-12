# UFSL Bracket Challenge — Progress

**Last Updated:** 2026-03-12 (Push notifications complete!)

---

## ✅ DONE — Everything is built and pushed

### GitHub
🔗 **https://github.com/progotta/ufsl-bracket**

### Build Status
✅ **Next.js build passes clean** — all 17 routes compile with no TypeScript errors

---

## What's Built

### 17. ✅ Push Notifications
- **Web Push API** — works Chrome, Firefox, Edge, Safari 16+
- **Service Worker** (`public/sw.js`) — handles push events + notification clicks with action buttons
- **VAPID keys** generated and documented in `.env.example`
- **`web-push` npm package** installed
- **Database migration** (`supabase/migrations/006_push_notifications.sql`) — `push_subscriptions` + `notification_preferences` tables with RLS
- **`src/lib/notifications.ts`** — `sendNotification()` + `sendBulkNotification()` with preference checking and expired subscription cleanup
- **API routes:**
  - `POST /api/notifications/subscribe` — save push subscription
  - `POST /api/notifications/unsubscribe` — remove subscription (specific or all)
  - `GET /api/notifications/preferences` — get user preferences
  - `PUT /api/notifications/preferences` — update preferences (auto-save)
  - `POST /api/notifications/send` — internal endpoint (protected by `NOTIFICATION_SECRET`)
- **`NotificationPrompt` component** — dismissible prompt, respects browser permission state, 7-day "not now" cooldown
  - Shown on dashboard (first visit)
  - Shown after bracket submission (in share modal)
- **`/settings/notifications` page** — full preferences UI with toggles for all 5 alert types, test notification button, subscribe/unsubscribe controls
- **Nav updated** — Bell icon links to notification settings (desktop + mobile)
- **6 notification types:** game_starting, upset_alert, pick_eliminated, pool_update, smack_mention, bracket_reminder

---

## What's Built (Previously)

### 1. ✅ Auth (All 5 methods) (Previously built)
- Google OAuth
- Apple OAuth  
- Facebook OAuth
- Email OTP (magic link / one-time code)
- SMS OTP via phone number (Twilio via Supabase)

All handled by `src/components/auth/AuthForm.tsx` — clean dark UI with provider buttons.

### 2. ✅ User Profiles
- Auto-created on signup from OAuth data
- Edit display name
- Avatar from OAuth provider
- Profile page at `/profile`

### 3. ✅ Pool Creation + Invite Links
- Create pool at `/pools/new`
- 8-character invite code (e.g. `ABCD1234`)
- Shareable invite URL: `/join/[code]`
- Commissioner role for pool creator
- Pool settings + lock/delete at `/pools/[id]/settings`
- Pools listing at `/pools`

### 4. ✅ Visual Bracket Picker
- 64 teams, 63 games
- Standard NCAA tournament format (4 regions + Final Four + Championship)
- Region filter tabs (All / East / West / South / Midwest / Final Four)
- Zoom in/out controls
- Pick teams by clicking
- Progress bar showing X/63 picks
- Save progress + Submit when complete
- Mobile responsive

### 5. ✅ Auto-Scoring
- Standard NCAA scoring: 1/2/4/8/16/32 points per round
- Score recalculated when commissioner enters game results
- Commissioner tools at `/pools/[id]/admin`
- Real-time score updates via Supabase Realtime

### 6. ✅ Leaderboard
- Within each pool
- Rank, display name, avatar, score, max possible score
- Live updates
- Shows your rank highlighted in orange

### Bonus features built:
- ✅ Landing page with basketball vibes + scoring explainer
- ✅ Dark theme throughout
- ✅ Mobile nav with hamburger menu
- ✅ 404 page ("Out of bounds!")
- ✅ Pool status badges (open/locked/active/completed)
- ✅ API routes for game updates and pool joining
- ✅ Middleware for auth-protected routes

---

## To Get This Running (Your Checklist)

### Step 1: Supabase Setup (~10 min)
1. Go to https://supabase.com → create new project
2. Copy **Project URL** and **Anon Key** from Settings → API
3. Go to SQL Editor → paste the contents of `supabase/migrations/001_initial_schema.sql` → Run
4. Go to Authentication → Providers and enable:
   - **Email** (already on) ✓
   - **Google**: needs Client ID/Secret from [Google Cloud Console](https://console.cloud.google.com) → OAuth 2.0 Client
   - **Apple**: needs Service ID from Apple Developer → Sign In with Apple  
   - **Facebook**: needs App ID/Secret from [Facebook Developers](https://developers.facebook.com)
   - **Phone/SMS**: needs Twilio SID, Auth Token, and From number

### Step 2: Environment Variables
Edit `/home/ubuntu/.openclaw/workspace/ufsl-bracket/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=https://your-vercel-url.vercel.app
```

### Step 3: Test Locally
```bash
cd /home/ubuntu/.openclaw/workspace/ufsl-bracket
npm run dev
```
Open http://localhost:3000

### Step 4: Deploy to Vercel
Option A — CLI:
```bash
npx vercel --prod
```

Option B — Web UI:
1. Go to vercel.com → New Project → Import from GitHub
2. Find `progotta/ufsl-bracket`
3. Add env vars in Vercel Settings → Environment Variables
4. Deploy

After deploy, update Supabase:
- Authentication → URL Configuration → **Site URL** → your Vercel URL
- Additional Redirect URLs → `https://your-app.vercel.app/**`

### Step 5: Before Selection Sunday (March 16)
The app uses placeholder/mock team data right now. After the bracket is revealed:
1. Go to Supabase → Table Editor → `teams`
2. Update the 64 teams with real names, seeds, and regions
3. The bracket picker will auto-use the real data

---

## Route Map

| URL | What it is |
|-----|-----------|
| `/` | Landing page |
| `/auth` | Sign in (all providers) |
| `/dashboard` | Main dashboard |
| `/pools` | Your pools list |
| `/pools/new` | Create a pool |
| `/pools/[id]` | Pool detail + leaderboard |
| `/pools/[id]/settings` | Commissioner: edit pool |
| `/pools/[id]/admin` | Commissioner: enter game results |
| `/pools/[id]/bracket/new` | Creates your bracket, redirects to editor |
| `/brackets/[id]` | Bracket picker/viewer |
| `/join` | Enter invite code |
| `/join/[code]` | Join specific pool |
| `/profile` | Edit your profile |

---

## Notes / Known Issues

- The `games` table in Supabase needs to be populated with the actual game schedule after Selection Sunday. The commissioner admin page at `/pools/[id]/admin` lets you enter results manually.
- Real-time scoring works via Supabase Realtime — users see score updates without refreshing.
- The bracket picker works on mobile but the "All regions" view is desktop-optimized. Use the region tabs on mobile.
- Apple OAuth requires a paid Apple Developer account to configure.
- If you skip any OAuth providers, just don't enable them in Supabase — the buttons will still show but will fail gracefully.

---

Built with ❤️ by your AI dev. GL with the tourney! 🏀
