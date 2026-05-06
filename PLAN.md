    // "dev": "dotenv -e .env.local -- sh -c \"NODE_OPTIONS='--import ./instrument.server.mjs' vite dev --port 3000\"",

# Bounty Supermarket SEO Ranking Tracker — Implementation Plan

> **"Great Savings Everyday"**
> Automates Google Maps position monitoring, review tracking, and citation management for Bounty Supermarket branches with minimal manual data entry.
> **Context:** Bounty Supermarket is a startup/local supermarket in **Kenya**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (React, SSR, Edge-ready) |
| Router | TanStack Router v1 (file-based, type-safe) |
| Data Fetching | TanStack Query + tRPC |
| Tables | TanStack Table v8 |
| Forms | TanStack Form |
| Auth | better-auth (Google OAuth + email/password) |
| Database | Neon Postgres (serverless) |
| ORM | Drizzle ORM |
| Charts | Recharts |
| UI Components | shadcn/ui (Radix UI + Tailwind CSS v4) |
| Icons | Lucide React |
| Toolchain | Biome (lint + format) |
| Package Manager | Bun |
| Monitoring | Sentry (`@sentry/tanstackstart-react`) |
| Deployment | Vercel (Edge Functions) |

---

## Route Architecture

```
src/routes/
  __root.tsx                        # HTML shell
  _app.tsx                          # Pathless layout: sidebar + topbar + auth guard
  _app/
    index.tsx                       # Dashboard       → /
    rankings.tsx                    # Rankings        → /rankings
    rankings.$keywordId.tsx         # Keyword detail  → /rankings/:id  ✅ NEW
    reviews.tsx                     # Reviews         → /reviews
    citations.tsx                   # Citations       → /citations
    locations.tsx                   # Locations       → /locations
    settings.tsx                    # Settings        → /settings
  login.tsx                         # Login page      → /login         ✅ NEW
  about.tsx                         # About           → /about
  api.trpc.$.tsx                    # tRPC endpoint   → /api/trpc/*
  api/auth/$.ts                     # better-auth     → /api/auth/*
```

---

## Database Schema

| Table | Purpose |
|---|---|
| `seo_locations` | Bounty Supermarket branches (Kenya) |
| `seo_keywords` | Search terms to monitor per branch |
| `seo_ranking_snapshots` | Historical Google Maps position data |
| `seo_reviews` | Customer reviews from Google / Facebook |
| `seo_citations` | Business directory listings (NAP tracking) |
| `user` | better-auth users |
| `session` | better-auth sessions |
| `account` | better-auth OAuth accounts |
| `verification` | better-auth email verification tokens |
| `todos` | Legacy demo table (preserved) |

---

## Environment Variables

```env
# Required
DATABASE_URL=postgres://...          # Neon Postgres connection string

# Authentication ✅ configured
BETTER_AUTH_SECRET=...               # Random secret ≥ 32 characters
BETTER_AUTH_URL=http://localhost:3000 # Base URL (update on deployment)
GOOGLE_CLIENT_ID=...                 # Google OAuth 2.0 Client ID
GOOGLE_CLIENT_SECRET=...             # Google OAuth 2.0 Client Secret

# SEO Features (Step 3+)
GOOGLE_MAPS_API_KEY=...              # Google Maps / Places API key

# Monitoring
SENTRY_DSN=...                       # Sentry project DSN

# Email Reporting (Step 7+)
RESEND_API_KEY=...                   # Resend email API key
```

---

## Implementation Steps

### ✅ Step 1 — Project Foundation & Brand Setup

- [x] Create `PLAN.md` and `AGENTS.md`
- [x] Define complete database schema (5 SEO tables)
- [x] Install `recharts` and `date-fns`
- [x] Install shadcn/ui components
- [x] Add Bounty brand CSS variables to `src/styles.css`
- [x] Create `BountyLogo` component
- [x] Create `Sidebar` component (dark sidebar, gold active states, nav links)
- [x] Update `__root.tsx` → minimal HTML shell
- [x] Create `_app.tsx` pathless layout (sidebar + top bar)
- [x] **Dashboard** (`_app/index.tsx`): KPI cards, rankings trend chart, rating distribution chart, recent reviews, keyword position changes
- [x] **Rankings** (`_app/rankings.tsx`): keyword table (TanStack Table), position trend per row, add-keyword form
- [x] **Reviews** (`_app/reviews.tsx`): reviews table with sentiment badges, filters, summary stats
- [x] **Citations** (`_app/citations.tsx`): directory listing table, NAP score badges, citation health gauge
- [x] **Locations** (`_app/locations.tsx`): location cards with stats
- [x] **Settings** (`_app/settings.tsx`): business info, API keys, notifications
- [x] Update tRPC router stubs for all SEO entities (with Sentry instrumentation)
- [x] **Kenya context**: All data, placeholders, and copy updated for Kenya (Nairobi, Mombasa, Kisumu, Nakuru; +254 phones; `.co.ke` website; Kenyan reviewers)

---

### ✅ Step 2 — Database & API Layer

- [x] Run `bun run db:push` — schema pushed to Neon Postgres
- [x] Implement full tRPC procedures using Drizzle ORM (locations, keywords, rankings, reviews, citations, dashboard)
- [x] Add Sentry `startSpan` instrumentation to all server functions
- [x] Create `src/db/seed.ts` — 4 Kenya locations, 22 keywords, 220 snapshots, 18 reviews, 12 citations
- [x] `trpc.seo.dashboard.stats` — aggregated KPIs + charts
- [x] `trpc.seo.rankings.trend` — chart data for LineChart
- [x] `trpc.seo.locations.withStats` — location cards with live counts
- [x] TanStack Query `invalidateQueries` wired to all mutations
- [x] All 6 pages use live DB data with loading skeletons
- [x] Added `trpc.seo.reviews.resolve` mutation (marks review resolved/unresolved)

---

### ✅ Step 3 — Rankings Tracker (Partial)

- [x] Real keyword CRUD via tRPC + Drizzle (create, delete, list)
- [x] Historical charts with real `seo_ranking_snapshots` data
- [x] Per-keyword position drill-down page (`/rankings/$keywordId`) — KPI cards, 90-day LineChart with inverted Y-axis, snapshot history table
- [x] Export rankings to CSV (`bounty-rankings-YYYY-MM-DD.csv`)
- [x] "Check Now" button wired to `trpc.seo.rankings.checkNow` mutation
- [ ] ⏸ **BLOCKED — Google Maps position polling** — needs `GOOGLE_MAPS_API_KEY`; `checkNow` server stub is in place, ready to wire when key is available
- [x] Bulk keyword import — "Import CSV" dialog with location picker, file parse preview, serial import with progress bar
- [ ] Ranking alerts: email when position drops below threshold (needs Resend API key)

---

### ✅ Step 4 — Review Tracker (Partial)

- [x] Reply workflow: "Reply" / "Edit Reply" dialog → saves via `trpc.seo.reviews.reply`
- [x] "Resolve" / "Resolved" toggle via `trpc.seo.reviews.resolve`
- [ ] ⏸ **BLOCKED — Google Business Profile API integration** — needs GBP API key
- [ ] ⏸ **BLOCKED — Automated review ingestion** — depends on GBP API key
- [x] Keyword-based sentiment tagging — server-side keyword matching via `seo.reviews.autoTag` mutation; "Auto-Tag Sentiment" button on reviews page
- [x] Review trend analytics — "Review Trends" card with avg-rating-by-month area chart and sentiment breakdown bar chart
- [x] Alert on new 1–2 star reviews — red banner shown when unresolved low-rating reviews exist, with "View all" filter shortcut
- [x] Per-location review breakdown — grid of compact branch cards with avg rating, pending count, negative count

---

### ✅ Step 5 — Citation Manager (Partial)

- [x] Pre-populated Kenya directory list in seed data (Google Business Profile, Facebook, Kenya Yellow Pages, Apple Maps, Bing, TripAdvisor, Foursquare, Yelp, KNCC)
- [x] NAP score display (0–100 bar) and field-level match icons
- [x] Status badges (active / incorrect / missing / unchecked)
- [x] "Check Now" button stub (wired to `trpc.seo.citations.checkNow`)
- [x] **"Add Citation" dialog** — wired with branch selector, directory name, URL fields, and `create` mutation
- [ ] ⏸ **BLOCKED — NAP auto-checker** — requires server-side fetch of live directory pages (CORS + scraping concerns; easier once deployed to Vercel Edge)
- [x] Directory coverage checklist — pre-defined list of 9 key Kenya directories (Google, Facebook, Apple Maps, Kenya Yellow Pages, Bing, TripAdvisor, Foursquare, Yelp, KNCC) with covered/issues/missing status and priority labels
- [ ] Bulk NAP audit report (PDF export)
- [ ] Missing citation discovery

---

### 🔄 Step 6 — Authentication & Access Control

- [x] better-auth installed and configured (`src/lib/auth.ts`)
- [x] Google OAuth social provider added
- [x] Email/password auth enabled
- [x] Auth API route at `/api/auth/*` (`src/routes/api/auth/$.ts`)
- [x] Branded login page at `/login` (dark panel + Google + email/password)
- [x] Auth guard on `_app.tsx` → redirects unauthenticated users to `/login`
- [x] Google OAuth env vars configured (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`)
- [x] **Auth tables in DB** — `user`, `session`, `account`, `verification` added to Drizzle schema, pushed to Neon
- [x] **Drizzle adapter** in `auth.ts` — sessions now persisted in Neon Postgres
- [ ] Role system: `admin` (full access) / `viewer` (read-only)
- [x] User management — "Team" tab in Settings lists all registered users with avatar, name, email, join date
- [x] **Settings General tab** wired to database — loads/saves business info via `trpc.seo.settings.get` / `upsert` with success feedback; timezone options fixed for Kenya/Africa (EAT, CAT, SAST, WAT, UTC)

---

### ⏾ Step 7 — Advanced Analytics & Reporting

- [x] SEO health score — composite 0–100 score card on dashboard (Rankings 40% + Reviews 35% + Citations 25%) with Excellent/Good/Needs Work/Critical labels
- [x] Side-by-side location comparison — "Compare Branches" tab on Locations page with 4 bar charts (position, reviews, citation score, keywords)
- [ ] Competitor keyword tracking
- [ ] Scheduled weekly PDF reports (Vercel Cron → email via Resend API key)
- [x] Custom date range picker — 7d/14d/30d/60d/90d pill selector on the dashboard trend chart
- [x] Data export: CSV for rankings, reviews, citations — all wired in Settings → Data tab with live tRPC queries

---

### ⏾ Step 8 — Production Readiness

- [x] Vercel deployment config — `vercel.json` created; `vite.config.ts` uses `preset: 'vercel'` when `VERCEL=1` env var is set, falls back to `'node'` locally
- [ ] Neon connection pooling (pgBouncer mode for Edge)
- [ ] Environment variable secrets in Vercel dashboard
- [ ] Sentry performance tracing + alert rules
- [ ] Rate limiting on Google API calls (Upstash Redis)
- [ ] Content Security Policy headers
- [x] `robots.txt` and `sitemap.xml` — created in `/public`; crawlers disallowed from `/api/`, `/demo/`, `/login`

---

## Bounty Brand Guidelines

| Token | Value | Usage |
|---|---|---|
| `--bounty-black` | `#0A0A0A` | Sidebar bg, dark elements |
| `--bounty-gold` | `#D4A017` | Active nav, highlights, accents |
| `--bounty-gold-muted` | `rgba(212,160,23,0.12)` | Active nav bg, hover states |
| `--bounty-sidebar-bg` | `#111111` | Sidebar background |
| `--bounty-sidebar-border` | `#1F1F1F` | Sidebar dividers |
| `--bounty-content-bg` | `#F8F9FA` | Main content area background |
| Chart primary | `#D4A017` | Gold for ranking/primary metric |
| Chart success | `#22C55E` | Green for improvements |
| Chart danger | `#EF4444` | Red for drops/issues |
| Chart info | `#3B82F6` | Blue for secondary metrics |
