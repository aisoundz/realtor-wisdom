# Realtor Wisdom

A real estate capital operating system. Deal Room, Real Wisdom AI, Capital Marketplace, Institution View — and the Real Impact Score™.

**Live at:** [realtorwisdom.io](https://realtorwisdom.io)

---

## Getting it live — step by step

This guide walks you from zero to a deployed app on `realtorwisdom.io`. Follow it in order. Each step is independent — if one breaks, you can pause and resume.

### Step 1 — Supabase project (5 min)

1. Go to [supabase.com](https://supabase.com) → Sign in with GitHub.
2. **New project**:
   - Name: `realtor-wisdom-prod`
   - Database password: generate a strong one and save it to your password manager (Supabase only shows it once).
   - Region: `us-east-1` (or whichever is closest to your users).
3. Wait ~2 min for provisioning.
4. Once provisioned, go to **Project settings → API** and copy three values into `.env.local`:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Publishable key (`sb_publishable_…`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Secret key (`sb_secret_…`, click **Reveal** — only shown once) → `SUPABASE_SECRET_KEY` (never expose this to the client)
5. Open **SQL editor → New query** and paste the entire contents of [`context/schema.sql`](./context/schema.sql). Click **Run**. You should see `Success. No rows returned.`
6. Go to **Authentication → Providers → Email** and confirm Email is enabled. For local dev, turn off "Confirm email" so you can test fast (turn back on for production).

### Step 2 — Anthropic API key (1 min)

1. Go to [console.anthropic.com](https://console.anthropic.com) → API Keys → **Create Key**.
2. Name it `realtor-wisdom-prod`.
3. Add billing if you haven't. $5 of credits is plenty to test.
4. Copy the key into `.env.local` as `ANTHROPIC_API_KEY`.

### Step 3 — Local install + dev server

From the project root:

```bash
cp .env.local.example .env.local
# Fill in the four values from steps 1 and 2

npm install
npm run dev
```

Visit `http://localhost:3000`. You should see the marketing site. Visit `/auth/signup` — create a test account. You should land on `/dashboard`.

### Step 4 — GitHub push (replace existing repo contents)

The existing `aisoundz/realtor-wisdom` repo contains the static marketing HTML on the GitHub Pages branch. We're replacing the `main` branch contents with the Next.js app.

```bash
cd "/Users/anistaylor/Documents/Realtor Wisdom"
git init
git remote add origin git@github.com:aisoundz/realtor-wisdom.git
git fetch origin
git checkout -b main
git add .
git commit -m "Replace static site with Next.js app"
git push -u origin main --force
```

⚠️ The `--force` push will overwrite the existing `main` branch. The static HTML lives on the `gh-pages` branch (or wherever GitHub Pages is publishing from) — you can disable GitHub Pages once Vercel is live.

### Step 5 — Vercel project (3 min)

1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub.
2. **Add New → Project** → import `aisoundz/realtor-wisdom`.
3. Framework preset should auto-detect as **Next.js**.
4. **Environment variables** — paste in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_SITE_URL` = `https://realtorwisdom.io`
5. Click **Deploy**. First build takes ~2 min.
6. Once deployed, visit the `*.vercel.app` URL Vercel gives you. Confirm the marketing site loads at `/`, signup works, dashboard loads.

### Step 6 — Point realtorwisdom.io at Vercel (10 min including DNS propagation)

In Vercel:

1. Project → **Settings → Domains** → Add `realtorwisdom.io` and `www.realtorwisdom.io`.
2. Vercel shows you DNS records to add. Copy them.

In GoDaddy:

1. Sign in → **My Products → Domains → realtorwisdom.io → DNS**.
2. Replace existing A and CNAME records with the ones Vercel gave you. Typically:
   - `A` record: `@` → `76.76.21.21`
   - `CNAME` record: `www` → `cname.vercel-dns.com.`
3. Save.

DNS propagates in 5–60 minutes. Vercel auto-provisions SSL. Once green checkmarks appear in Vercel's domains panel, `https://realtorwisdom.io` is live.

### Step 7 — Update Supabase auth redirect URLs

In Supabase → **Authentication → URL Configuration**:

- Site URL: `https://realtorwisdom.io`
- Redirect URLs: add `https://realtorwisdom.io/**` and `http://localhost:3000/**`

This makes magic links and email confirmations work in production.

---

## Architecture overview

```
realtor-wisdom/
├── CLAUDE.md                       Read-first orientation for every Claude session
├── context/                        Persistent context — referenced by every build session
│   ├── realtor-wisdom-brief.md     Product brief
│   ├── brand-tokens.md             Colors, fonts, Tailwind tokens
│   ├── schema.sql                  Supabase database schema
│   ├── real-wisdom-prompt.md       AI advisor system prompt
│   └── realtor-wisdom-v3.html      Marketing site, design source of truth
├── public/
│   └── marketing.html              Served at / for unauthenticated visitors (rewrite)
├── app/
│   ├── layout.tsx                  Root layout (DM Sans + DM Serif Display)
│   ├── globals.css                 Tailwind + base styles
│   ├── auth/
│   │   ├── login/page.tsx          Sign in
│   │   └── signup/page.tsx         Create account
│   ├── dashboard/page.tsx          Authenticated home — deal grid
│   ├── deals/
│   │   ├── page.tsx                Deals index (placeholder)
│   │   └── [id]/page.tsx           Deal Room (placeholder, built next)
│   ├── marketplace/page.tsx        Capital Marketplace (placeholder)
│   ├── portfolio/page.tsx          Institution View (placeholder)
│   ├── real-wisdom/page.tsx        Full Real Wisdom chat (placeholder)
│   ├── impact-score/page.tsx       RIS dashboard (placeholder)
│   └── api/
│       └── real-wisdom/route.ts    Streaming Anthropic Claude proxy with deal context
├── lib/
│   ├── supabase/                   Browser, server, and middleware Supabase clients
│   ├── anthropic/client.ts         Anthropic SDK + system prompt
│   └── ris/calculator.ts           Real Impact Score composite calculator
├── middleware.ts                   Auth gate — redirects authenticated users from /
└── tailwind.config.ts              Brand tokens
```

## Tech stack

- **Frontend:** Next.js 14 App Router + React 18
- **Styling:** Tailwind CSS (brand tokens in `tailwind.config.ts`)
- **Database:** Supabase Postgres + Auth + Storage + Realtime
- **AI:** Anthropic Claude (`claude-sonnet-4-20250514`) with streaming
- **Hosting:** Vercel (auto-deploys from `main`)
- **Domain:** `realtorwisdom.io` via GoDaddy DNS → Vercel
- **Fonts:** DM Serif Display (headings), DM Sans (body) via Google Fonts

## What's built vs. what's next

**Built (this scaffold):**
- Full project structure + configs
- Supabase clients (browser, server, middleware)
- Anthropic streaming Real Wisdom API route with deal-context injection
- Auth flow — sign in, sign up, session middleware, route protection
- Marketing site served at `/` via rewrite, auth users redirect to `/dashboard`
- Dashboard with deal grid pulling from Supabase
- Tailwind brand tokens wired

**Next session priorities:**
1. **Deal Room** at `/deals/[id]` — capital stack table, compliance checklist, milestone timeline, stakeholder panel, activity feed, and the sliding Real Wisdom panel that opens on every capital row click.
2. **Capital Marketplace** at `/marketplace` — match cards with fit scoring against `marketplace_sources`.
3. **Institution View** at `/portfolio` — portfolio table with health scores and Fund RIS.
4. **RIS Dashboard** at `/impact-score` — SVG ring + dimension bars, belief capital moment log.
5. **New deal flow** at `/deals/new` — multi-step deal creation with onboarding.

## Non-negotiables (from `CLAUDE.md`)

- Real Wisdom is **proactive** — flags risk before the user asks.
- Real Wisdom is **deal-aware** — never generic when deal data exists.
- Real Wisdom speaks **real estate capital** — TIF, CDFI, NMTC, LIHTC, DSCR, AMI, HUD, draw schedules.
- The **Real Impact Score™** is central — every interaction with downstream value gets logged.
- The deal room is the **first impression** — fast, dark-themed, interactive.
- The **public deal profile** is shareable without login.
