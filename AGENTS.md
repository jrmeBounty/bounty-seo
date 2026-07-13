# AGENTS.md — Bounty Supermarket SEO Tracker

This file provides durable project context for AI coding agents working in this repository.
Always read this file before making architectural or library-specific changes.

---

## Project Identity

| Field | Value |
|---|---|
| **App Name** | Bounty Supermarket SEO Ranking Tracker |
| **Client** | Bounty Supermarket ("Great Savings Everyday") |
| **Purpose** | Automate Google Maps position monitoring, review tracking, and citation management for Bounty Supermarket branches |
| **Repository** | `my-tanstack-app` |

---

## TanStack CLI Scaffold Command

```bash
npx @tanstack/cli@latest create my-tanstack-app \
  --agent \
  --package-manager bun \
  --toolchain biome \
  --add-ons tanstack-query,tRPC,better-auth,drizzle,neon,table,form,sentry,shadcn
```

The project was bootstrapped from this command. The API-first React starter was selected.

---

## TanStack Libraries in Use

| Library | Package | Role |
|---|---|---|
| TanStack Start | `@tanstack/react-start` | Full-stack React framework (SSR + Edge) |
| TanStack Router | `@tanstack/react-router` | File-based type-safe routing |
| TanStack Query | `@tanstack/react-query` | Server state, caching, revalidation |
| TanStack Table | `@tanstack/react-table` | Headless data tables |
| TanStack Form | `@tanstack/react-form` | Type-safe form handling |
| TanStack Store | `@tanstack/react-store` | Client-side state store |

---

## Stack & Integrations

### API & Data
- **tRPC** v11 — `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`
- **Drizzle ORM** — `drizzle-orm` with `drizzle-kit`
- **Neon Postgres** — `@neondatabase/serverless` + `neon-vite-plugin`

### Auth
- **better-auth** — Google OAuth; sessions stored in Neon DB

### UI
- **shadcn/ui** (style: new-york) — component library via `components.json`
- **Tailwind CSS v4** — using `@tailwindcss/vite` plugin (NOT `tailwind.config.js`)
- **Recharts** — charts (`LineChart`, `BarChart`, `AreaChart`, `ResponsiveContainer`)
- **Lucide React** — icons throughout

### Monitoring
- **Sentry** — `@sentry/tanstackstart-react`; initialized in `instrument.server.mjs`

### Toolchain
- **Biome** `2.4.5` — linting and formatting (replaces ESLint + Prettier)
- **Bun** — package manager and runtime

---

## Architecture Decisions

### Recharts instead of Tremor
`@tremor/react` v3 requires Tailwind CSS v3 patterns (`require('@tremor/react')` in Tailwind config).
This project uses Tailwind v4 with the Vite plugin (`@tailwindcss/vite`) — incompatible.
**Decision:** Use Recharts directly with Tailwind-styled wrappers mimicking the Tremor API.

### Pathless Layout Route (`_app.tsx`)
TanStack Router supports pathless layout routes. Files prefixed with `_` are layouts:
- `src/routes/_app.tsx` — layout for all main SEO tracker pages
- `src/routes/_app/` — directory containing child routes of this layout

The `__root.tsx` is a minimal HTML shell (no global nav) so demo routes and the SEO app
can have completely different chrome.

### Database Table Naming
All SEO tracker tables are prefixed `seo_` to avoid conflicts with the existing `todos` demo table.

### Sentry Instrumentation Pattern
Per `.cursorrules`, all `createServerFn` implementations must be wrapped:
```tsx
import * as Sentry from '@sentry/tanstackstart-react'

Sentry.startSpan({ name: 'descriptive span name' }, async () => {
  // server function body
})
```

---

## File Structure

```
my-tanstack-app/
├── PLAN.md                     # 8-step implementation roadmap
├── AGENTS.md                   # This file — project context for agents
├── src/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui generated components
│   │   ├── BountyLogo.tsx      # Logo component (uses /public/BOUNTY_CART_YELLOW.svg)
│   │   ├── Sidebar.tsx         # Dark sidebar with gold active states
│   │   ├── Header.tsx          # Bounty-branded top bar (used by demo routes)
│   │   └── Footer.tsx          # Bounty-branded footer (used by demo routes)
│   ├── db/
│   │   ├── index.ts            # Drizzle db instance (node-postgres)
│   │   └── schema.ts           # All table definitions incl. seo_* tables
│   ├── integrations/
│   │   ├── better-auth/        # Auth client + header user component
│   │   ├── tanstack-query/     # QueryClient + devtools
│   │   └── trpc/
│   │       ├── init.ts         # tRPC init + context
│   │       ├── router.ts       # All tRPC procedures (todos + SEO stubs)
│   │       └── react.ts        # Client-side tRPC hooks
│   ├── lib/
│   │   ├── auth.ts             # better-auth server config
│   │   ├── auth-client.ts      # better-auth client
│   │   ├── sentry.ts           # Sentry helpers (withSentryServerSpan, etc.)
│   │   ├── website-crawler.ts  # Website SEO crawler engine
│   │   └── utils.ts            # shadcn cn() utility
│   ├── routes/
│   │   ├── __root.tsx          # HTML shell + devtools (no nav chrome)
│   │   ├── _app.tsx            # SEO app layout (sidebar + topbar)
│   │   ├── _app/
│   │   │   ├── index.tsx       # Dashboard         → /
│   │   │   ├── rankings.tsx    # Rankings Tracker   → /rankings
│   │   │   ├── reviews.tsx     # Review Tracker     → /reviews
│   │   │   ├── citations.tsx   # Citation Manager   → /citations
│   │   │   ├── locations.tsx   # Location Manager   → /locations
│   │   │   ├── settings.tsx    # Settings           → /settings
│   │   │   ├── website.tsx     # Website SEO Dashboard → /website
│   │   │   └── website/        # Website SEO Module pages
│   │   │       ├── pages.tsx   # Pages List         → /website/pages
│   │   │       ├── pages.$pageId.tsx # Page Detail  → /website/pages/:id
│   │   │       ├── issues.tsx  # Issues Manager     → /website/issues
│   │   │       └── backlinks.tsx # Backlinks        → /website/backlinks
│   │   ├── about.tsx           # About              → /about
│   │   ├── api.trpc.$.tsx      # tRPC handler       → /api/trpc/*
│   │   └── demo/               # Dev demos (preserved as-is)
│   └── styles.css              # Tailwind v4 + Bounty brand CSS vars
├── scripts/                    # CLI scripts
│   └── crawl-website.ts        # Website SEO crawler CLI
├── drizzle.config.ts
├── vite.config.ts
├── biome.json
├── components.json             # shadcn/ui config
└── package.json
```

---

## Environment Variables

```env
# .env.local (gitignored)

# Required — Neon Postgres
DATABASE_URL=postgres://user:pass@host/db?sslmode=require

# Required — better-auth (min 32 chars random)
BETTER_AUTH_SECRET=replace_me_with_32_plus_char_random_string

# Required for Google Sign-In
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# Step 2+ — Google Maps/Places API
GOOGLE_MAPS_API_KEY=AIzaSy...

# Sentry (optional in dev)
SENTRY_DSN=https://xxx@oxx.ingest.sentry.io/xxx

# Step 7+ — Email reports
RESEND_API_KEY=re_xxx
```

---

## Key Commands

```bash
# Development
bun run dev               # Dev server on :3000 (with Sentry + dotenv)

# Database
bun run db:push           # Push schema changes to Neon (no migration file)
bun run db:generate       # Generate SQL migration file
bun run db:migrate        # Run pending migration files
bun run db:studio         # Open Drizzle Studio (local DB GUI)

# Code Quality
bun run check             # Biome: lint + format check
bun run format            # Biome: format (writes)
bun run lint              # Biome: lint only

# Website SEO Crawler
bun run crawl:website <url>       # Crawl single page
bun run crawl:website --full      # Crawl common ecommerce pages
bun run crawl:website --homepage  # Crawl homepage only

# Build & Deploy
bun run build             # Production build
bun run start             # Serve production build
bun run preview           # Vite preview of build

# Package Management
bun add <pkg>             # Add a runtime dependency
bun add -d <pkg>          # Add a dev dependency
bun x shadcn@latest add <component>  # Add a shadcn/ui component
```

---

## Bounty Brand Tokens

Defined in `src/styles.css` as CSS custom properties:

| Token | Value | Usage |
|---|---|---|
| `--bounty-black` | `#0A0A0A` | Sidebar base |
| `--bounty-gold` | `#D4A017` | Active states, badges, accents |
| `--bounty-gold-muted` | `rgba(212,160,23,0.12)` | Hover / active bg |
| `--bounty-sidebar-bg` | `#111111` | Sidebar background |
| `--bounty-sidebar-border` | `#1F1F1F` | Sidebar internal borders |
| `--bounty-content-bg` | `#F8F9FA` | Main content area bg |

---

## Known Gotchas

1. **Tailwind v4 config** — NO `tailwind.config.js`. All config is in `src/styles.css` using
   `@theme inline {}` and `@custom-variant`. Use `@apply` carefully; utility classes preferred.
2. **Tremor incompatible** — Do not attempt to install `@tremor/react`. Use recharts.
3. **`bun` not `npm/pnpm`** — Always use `bun` for package operations.
4. **Biome not ESLint/Prettier** — Run `bun run check` to validate code style.
5. **Pathless layout naming** — `_app.tsx` + `_app/` directory for child routes.
   Ensure the old `routes/index.tsx` is deleted before creating `routes/_app/index.tsx`.
6. **Sentry init** — `instrument.server.mjs` is imported via `NODE_OPTIONS` in `dev` script.
   The `--import` flag runs it before anything else. Don't move it.
7. **Neon Edge mode** — In production (Vercel Edge), use `neon()` from `@neondatabase/serverless`
   instead of `node-postgres`. The `neon-vite-plugin.ts` handles this automatically.
8. **better-auth sessions** — Require a `DATABASE_URL` for production. Local dev can use
   an in-memory fallback if the DB is unreachable (configure in `src/lib/auth.ts`).

---

## Known Import Gotcha — `#/db` vs `#/db/index`

The project has **two** db-related files:
- `src/db.ts` — Neon serverless client (legacy, used by demo routes)
- `src/db/index.ts` — Drizzle ORM instance (the one tRPC uses)

The `#/*` alias maps to `./src/*`, so `#/db` resolves to `src/db.ts` (the Neon file).  
Always import the Drizzle instance as **`#/db/index`**, not `#/db`.

```typescript
// Correct
import { db } from '#/db/index'

// Wrong — resolves to src/db.ts (Neon client, no `db` export)
import { db } from '#/db'
```

## Agent Guidelines — Documentation Policy

**CRITICAL:** Do NOT create unnecessary markdown files or documentation.

**Only create MD files when:**
- Absolutely necessary for project operation (e.g., README with setup instructions)
- Documenting extremely complex architectural decisions that affect multiple files
- Recording critical business logic that cannot be understood from code alone

**Never create:**
- Status reports or summaries for the user
- Testing guides or checklists
- "What to expect" documents
- Setup completion reports
- Any documentation that explains what the code already explains

**Instead:** Answer user questions directly in chat. The code and this AGENTS.md file should be the primary documentation.

---

## Module Overview — Website SEO Tracker

**Purpose:** SEO optimization tracking for bountybasket.online (Bounty's ecommerce site)

**Status:** ✅ Fully implemented and working

### Database Tables (7 new tables)
- `seo_pages` — Tracks every crawled page with SEO scores
- `seo_issues` — SEO problems (critical, warning, info) per page
- `seo_keyword_rankings` — Organic keyword position tracking
- `seo_backlinks` — Inbound link monitoring
- `seo_content_suggestions` — Content optimization recommendations
- `seo_competitor_analysis` — Competitor SEO metrics
- `seo_audit_history` — Historical audit snapshots

### API Layer (tRPC)
All procedures under `seo.website.*`:
- `stats` — Dashboard statistics
- `pages.*` — Page CRUD (list, get, create)
- `issues.*` — Issue management (list, resolve)
- `backlinks.*` — Backlink tracking (list, create)
- `keywords.*` — Keyword tracking (list, create)
- `audit.*` — Audit history (history, create)

### Crawler Engine (`src/lib/website-crawler.ts`)
- Fetches and parses HTML with Cheerio
- Performs 20+ SEO checks (title, meta, headings, word count, images, etc.)
- Calculates SEO score (0-100) based on Content (60%) + Technical (40%)
- Detects issues with severity levels (1-10) and impact (high/medium/low)

### CLI Script (`scripts/crawl-website.ts`)
```bash
bun run crawl:website <url>       # Crawl single page
bun run crawl:website --full      # Crawl common pages (/about, /shop, etc.)
bun run crawl:website --homepage  # Crawl homepage only
```

**Output:** Saves page analysis and issues to database, creates audit history record

### User Interface (5 pages)
1. `/website` — Dashboard with overall stats, top pages, recent issues
2. `/website/pages` — Table of all crawled pages with search/filter
3. `/website/pages/$pageId` — Full page detail with issues and recommendations
4. `/website/issues` — Issues manager with filters and resolve functionality
5. `/website/backlinks` — Backlink tracker with add dialog

### SEO Checks Performed
**Critical (Severity 8-10):**
- Missing title tag
- Missing meta description
- Missing H1 heading
- Page not indexable (noindex)

**Warnings (Severity 4-6):**
- Title too short/long
- Meta description too short/long
- Thin content (<300 words)
- No H2 subheadings
- Missing canonical URL
- Images missing alt text

**Info (Severity 1-3):**
- Missing schema markup
- Few internal links

### Integration Notes
- All pages wrapped with Sentry spans for error tracking
- Uses existing auth guard from `_app.tsx` layout
- Follows Bounty brand tokens (gold accents, dark theme)
- Uses shadcn/ui components (Table, Card, Badge, Dialog)

### Future Enhancements (Not Implemented)
- Google Search Console API integration for real keyword rankings
- Vercel Cron for automated daily crawls
- Email alerts for critical issues (Resend API)
- Competitor monitoring automation
- AI-powered content suggestions (OpenAI API)

**See `WEBSITE-SEO-COMPLETE.md` for full usage guide.**

---

## Next Steps After Step 2

1. Visit `http://localhost:3000` — the Dashboard should display live data from the database
2. Run `bun run db:seed` any time you want to reset to clean demo data
3. Add keyword via `/rankings` → "Add Keyword" button — persists to DB and invalidates the list
4. Proceed to **Step 3**: wire `GOOGLE_MAPS_API_KEY`, implement real position checks, set up Vercel Cron

---

*Last updated: Website SEO Module added — Full website optimization tracking for bountybasket.online*
