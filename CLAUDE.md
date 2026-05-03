# Realtor Wisdom

**Read this first. Every session.**

We are building Realtor Wisdom — a real estate capital operating system. The marketing site is `context/realtor-wisdom-v3.html` and is the design source of truth. The Real Impact Score™ is the signature feature — it measures belief capital moments, network activations, and survival interventions alongside financial returns. Real Wisdom is the AI advisor — proactive, real estate native, always in the deal room. Never generic. Always deal-specific.

## The four modules

1. **Deal Room** — developer's command center. Capital stack tracker, compliance checklist, milestone timeline, stakeholder view, post-close monitoring.
2. **Real Wisdom AI** — proactive AI advisor trained on real estate. Flags risk before you ask, drafts outreach, identifies unclaimed capital, voice mode.
3. **Capital Marketplace** — AI-matched capital sources ranked by fit score. Deal profile is the application. One-click add to stack.
4. **Institution View** — portfolio intelligence for funds and lenders. Fund Real Impact Score, relationship depth, early warning signals.

## Tech stack (locked)

- **Frontend:** Next.js 14 App Router
- **Styling:** Tailwind CSS
- **Database:** Supabase (Postgres + auth + realtime + storage)
- **AI:** Anthropic Claude API (`claude-sonnet-4-20250514`) for Real Wisdom
- **Auth:** Supabase Auth
- **Deployment:** Vercel
- **Domain:** realtorwisdom.io (registered at GoDaddy, points at Vercel via DNS)
- **Repo:** github.com/aisoundz/realtor-wisdom (replaces the static GitHub Pages marketing site)
- **Fonts:** DM Serif Display (headings) + DM Sans (body)

## Context files (always reference)

- `context/realtor-wisdom-brief.md` — product brief, modules, signature feature
- `context/brand-tokens.md` — colors, fonts, Tailwind config
- `context/schema.sql` — full Supabase database schema
- `context/real-wisdom-prompt.md` — Real Wisdom system prompt
- `context/realtor-wisdom-v3.html` — marketing site, design source of truth

## Non-negotiables

- Real Wisdom is **proactive**, not reactive. It flags what's wrong before the user asks.
- Real Wisdom is **deal-aware**. Never give generic advice when deal-specific data is available.
- Real Wisdom speaks the language of **real estate capital** — TIF, CDFI, NMTC, LIHTC, DSCR, AMI, HUD, draw schedules. Not generic finance.
- The **Real Impact Score™** is central. Every interaction that creates downstream value gets logged as a belief capital moment.
- The deal room is the first impression. Fast, dark-themed, interactive. Every capital stack row opens a Real Wisdom panel on the right.
- The public deal profile is shareable without login.

## Build order

1. Supabase project → run `context/schema.sql`
2. Vercel project → connect GitHub repo
3. Set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`
4. Deploy marketing site (static `realtor-wisdom-v3.html`) → verify it loads at the root domain
5. Auth flow (sign up / sign in)
6. Deal Room → connect to Supabase
7. Real Wisdom API route → streaming
8. Capital Marketplace → match scoring
9. Institution View → portfolio table
10. RIS dashboard → score computation
