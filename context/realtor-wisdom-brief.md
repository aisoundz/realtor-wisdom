# Realtor Wisdom — Product Brief

## What it is

Realtor Wisdom is a real estate capital operating system. Four modules, one platform, one AI advisor at the center. Built for developers, impact funds, CDFIs, lenders, agencies, and accelerators — the people who actually move capital into real assets.

## The four modules

### 1. Deal Room — the developer's command center
The single workspace a developer lives in for an active project.

- **Capital stack tracker** — sources, committed amounts, status (approved / pending / in LOI / requested / gap / confirmed), notes per row. Every row is interactive — clicking opens a Real Wisdom response panel on the right.
- **Compliance checklist** — items grouped by phase (pre-development, capital stack, construction close, post-close). Each item has done / pending / blocked / todo state. Items can be flagged as blocking close.
- **Milestone timeline** — done / active / todo states across the deal lifecycle.
- **Stakeholder view** — who's in the deal, their role, action items pending on each.
- **Activity feed** — actions taken by Real Wisdom, stakeholders, system events, and belief capital moments — chronological.
- **Public deal profile** — shareable view without login. Lives at a public URL when toggled.
- **Post-close monitoring** — once construction closes, the deal stays alive for outcome tracking.

### 2. Real Wisdom AI — the advisor
A proactive AI advisor trained on real estate capital. Not a generic chatbot.

- **Proactive** — flags risk before the user asks. Reviews deal data continuously and surfaces what's wrong.
- **Real estate native** — speaks TIF, CDFI, NMTC, LIHTC, DSCR, AMI, HUD, draw schedules. Not generic finance.
- **Deal-aware** — every response is grounded in the user's specific deal data.
- **Drafts work** — outreach emails, capital applications, deal packages, term sheets.
- **Identifies unclaimed capital** — looks at the deal profile and tells you what you're not asking for that you should be.
- **Voice mode** — hands-free, on-site usable.
- **Embedded everywhere** — sliding panel in deal room, full chat at `/real-wisdom`, inline insight bars.

### 3. Capital Marketplace
AI-matched capital sources, ranked by fit.

- The **deal profile is the application**. No separate forms.
- Match score per source based on amount, region, AMI requirements, deal type, source preferences.
- Filter by source type: impact loans, CDFI, TIF, NMTC, grants, equity, TI prepaid, PRI, developer equity.
- One-click add to capital stack.

### 4. Institution View
Portfolio intelligence for funds and lenders.

- Portfolio table — every active investment, deployed vs. committed, targeted return, health score.
- **Fund Real Impact Score** — the institution-side composite of all the deals they're in.
- **Relationship depth** — measures the substance of the fund's involvement beyond capital deployed.
- **Early warning signals** — Real Wisdom watching every deal in the portfolio for trouble.

## The signature feature: Real Impact Score™

The first metric in real estate investing that measures the full causal chain from belief capital moment to community outcome. Not just jobs and units. The conversation, the introduction, the bridge loan that kept a company alive. Three connected scores:

- **Developer score** — community outcomes, financial performance, growth trajectory, network depth, belief capital received.
- **Investor / fund score** — survival interventions, network activations, mentorship, plus the deals' aggregate community outcomes.
- **Community score** — outcomes per neighborhood, weighted by depth of impact.

Every interaction that creates downstream value gets logged as a **belief capital moment** with downstream value attribution.

## Audiences

- **Developers** — primary daily user. Lives in Deal Room.
- **Impact funds & CDFIs** — primary institutional user. Lives in Institution View.
- **Lenders** (banks, credit unions) — Institution View + portfolio monitoring.
- **Agencies** (HUD, state housing finance) — public deal profile + RIS aggregates.
- **Accelerators** — community of developers using the platform together.

## Design source of truth

`context/realtor-wisdom-v3.html` — the marketing site. All spacing, component patterns, interaction models, and copy decisions trace back to it.

## What we are not

- Not a generic project management tool with real estate skinning.
- Not a CRM.
- Not an underwriting model. (We surface underwriting, we don't replace it.)
- Not a generic finance assistant — Real Wisdom is real estate native.
