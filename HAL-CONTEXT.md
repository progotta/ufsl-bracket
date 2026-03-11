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

- [ ] Supabase project not created yet
- [ ] OAuth providers not configured (Google, Apple, Facebook, Twilio)
- [ ] Not deployed to Vercel yet
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

**None** — just needs infrastructure setup and deploy.

---

## Next Actions

1. Create Supabase project
2. Run `supabase/migrations/001_initial_schema.sql` in SQL editor
3. Enable auth providers (start with Google + Email, add others later)
4. Set env vars locally, test with `npm run dev`
5. Deploy to Vercel, set env vars there
6. Update Supabase Site URL to Vercel URL
7. After Selection Sunday: populate real teams in `teams` table

---

## Deployment Checklist

```bash
# Local test
cd repos/ufsl-bracket
cp .env.example .env.local
# Edit .env.local with Supabase credentials
npm install
npm run dev

# Deploy
npx vercel --prod
# Add env vars in Vercel dashboard
```

---
