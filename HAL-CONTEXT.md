# HAL-CONTEXT.md — UFSL Bracket

_Last updated: 2026-03-11_

---

## Status

✅ **COMPLETE** — Ready to deploy. All features built, clean Next.js build, 17 routes.

---

## What's Built

- **Auth:** Google, Apple, Facebook, Email OTP, SMS OTP (via Supabase + Twilio)
- **User profiles:** Auto-created from OAuth, editable display name, avatars
- **Pools:** Create pool, 8-char invite codes, commissioner role, lock/delete
- **Bracket picker:** 64 teams, 63 games, region tabs, zoom controls, save/submit
- **Scoring:** Auto-calculated (1/2/4/8/16/32 per round), recalculates on result entry
- **Leaderboard:** Real-time via Supabase Realtime, rank highlighting
- **Commissioner tools:** Enter game results at `/pools/[id]/admin`
- **UI:** Dark theme, mobile responsive, landing page, 404

---

## What's NOT Built / TODO

- [x] ~~Supabase project not created yet~~ — DONE 2026-03-11
- [x] ~~Not deployed to Vercel yet~~ — LIVE at https://ufsl-bracket.vercel.app
- [ ] OAuth providers not fully configured (Google, Apple, Facebook, Twilio) — need to set up in Supabase Auth
- [ ] Supabase redirect URLs need configuration (Site URL + Redirect URLs)
- [ ] Teams table has placeholder data — needs real teams after Selection Sunday (March 16)

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Auth/DB:** Supabase (Auth + Postgres + Realtime)
- **Styling:** Tailwind CSS (dark theme)
- **Deployment:** Vercel
- **SMS:** Twilio via Supabase Phone Auth

---

## Key Files

| File | Purpose |
|------|---------|
| `src/app/` | All routes (17 pages) |
| `src/components/auth/AuthForm.tsx` | All 5 auth methods |
| `src/components/bracket/BracketPicker.tsx` | Main bracket UI |
| `src/lib/supabase.ts` | Supabase client |
| `supabase/migrations/001_initial_schema.sql` | Database schema |
| `.env.example` | Required env vars |
| `PROGRESS.md` | Detailed setup instructions |

---

## Gotchas

- Apple OAuth requires paid Apple Developer account
- Phone/SMS auth requires Twilio account with verified number
- After deploying, must update Supabase Site URL + redirect URLs
- Bracket picker "All regions" view optimized for desktop — use region tabs on mobile

---

## Current Blockers

**Auth config** — Need to configure Supabase Authentication:
1. Set Site URL to `https://ufsl-bracket.vercel.app`
2. Add redirect URL `https://ufsl-bracket.vercel.app/**`
3. Enable OAuth providers (Google at minimum)

---

## Multi-Environment Strategy

### Environments

| Environment | URL | Purpose | Auto-Deploy |
|-------------|-----|---------|-------------|
| **Dev/Test** | https://ufsl-bracket.vercel.app | Development, testing, March Madness 2026 pilot | Yes, on push to `main` |
| **Production** | https://ufsl.net | Long-term home for UFSL platform | Requires Vercel custom domain setup |

### What Needs to Change for Production (ufsl.net)

1. **Vercel Custom Domain:** Add `ufsl.net` in Vercel project settings (DNS → point to Vercel)
2. **Supabase Auth URLs:** Add production URLs to allowed list:
   - Site URL: `https://ufsl.net`
   - Redirect URLs: `https://ufsl.net/**`
3. **Environment Variables:** Production Vercel env vars should use same Supabase project OR a separate prod Supabase project (recommended for isolation)
4. **OAuth Providers:** Redirect URIs in Google/Apple/Facebook consoles need `https://ufsl.net` added

### Environment-Specific Configs

```bash
# .env.local (local dev)
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>

# Vercel: ufsl-bracket.vercel.app (Dev/Test)
# - Set in Vercel dashboard → Environment Variables → Preview/Production

# Vercel: ufsl.net (Production)
# - Same vars but can point to a different Supabase project for isolation
# - Or same Supabase project with both URLs whitelisted in Auth settings
```

### Recommended Path

1. Keep current setup (ufsl-bracket.vercel.app) for March Madness 2026 pilot
2. After pilot: evaluate usage, then set up ufsl.net as production
3. Consider separate Supabase projects for staging vs production data isolation

---

## Next Actions

1. ~~Create Supabase project~~ ✅
2. ~~Run migration SQL~~ ✅
3. ~~Deploy to Vercel~~ ✅
4. Configure Supabase Auth redirect URLs (Site URL + Redirect URLs)
5. Enable OAuth providers (Google + Email minimum)
6. Test auth flow end-to-end
7. After Selection Sunday (March 16): populate real teams in `teams` table
8. (Future) Set up ufsl.net custom domain in Vercel for production

---

## Deployment Checklist

```bash
# Local test
cd repos/ufsl-bracket
cp .env.example .env.local
# Edit .env.local with Supabase credentials
npm install
npm run dev

# Deploy (auto via git push to main → Vercel)
# Manual deploy if needed:
npx vercel --prod
# Add env vars in Vercel dashboard
```

---
