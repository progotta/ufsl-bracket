# NEEDS_APPROVAL.md

Items requiring manual approval/action. Most of the app is built and ready.

---

## 1. GitHub Push (READY TO PUSH)

The repo was created at: **https://github.com/progotta/ufsl-bracket**

The local git repo is initialized and committed. To push:

```bash
cd /home/ubuntu/.openclaw/workspace/ufsl-bracket
git push -u origin main
```

Remote is already configured with PAT.

---

## 2. npm install

```bash
cd /home/ubuntu/.openclaw/workspace/ufsl-bracket
npm install --legacy-peer-deps
```

This needs to run before `npm run dev` will work.

---

## 3. Supabase Setup (Manual — requires your credentials)

1. Create project at https://supabase.com
2. Copy project URL and anon key
3. Edit `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
4. Run the SQL migration in Supabase SQL Editor:
   `supabase/migrations/001_initial_schema.sql`

5. Enable Auth providers in Supabase Dashboard:
   - Authentication → Providers → Google (need Client ID + Secret from Google Cloud Console)
   - Authentication → Providers → Apple (need Apple Developer credentials)
   - Authentication → Providers → Facebook (need Facebook App ID + Secret)
   - Authentication → Providers → Phone → enable + add Twilio credentials (for SMS OTP)
   - Email is on by default ✓

---

## 4. Vercel Deploy (after npm install works)

```bash
npx vercel --prod
```

Or: Connect GitHub repo at vercel.com → New Project → import progotta/ufsl-bracket

Set env vars in Vercel dashboard.

---

## Status

Everything EXCEPT npm install + git push is done and ready.
All code is written and committed locally.
