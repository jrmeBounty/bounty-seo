# Bounty Supermarket — SEO Tracker

> **"Great Savings Everyday"**

Automates Google Maps ranking monitoring, review tracking, and citation management for Bounty Supermarket branches in Kenya.

---

## Quick Start

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your database URL and API keys

# Push database schema
bun run db:push

# Seed database with sample data
bun run db:seed

# Run development server
bun run dev
```

Visit http://localhost:3000

---

## Essential Commands

```bash
# Development
bun run dev               # Start dev server (localhost:3000)

# Database
bun run db:push           # Push schema changes to Neon
bun run db:seed           # Seed database with sample data
bun run db:studio         # Open Drizzle Studio (database GUI)

# Website SEO Crawler
bun run crawl:website <url>     # Crawl single page
bun run crawl:website --full    # Crawl common pages

# Code Quality
bun run check             # Run Biome linter + formatter
bun run format --write    # Format code

# Build & Deploy
bun run build             # Production build for Vercel
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (React SSR) |
| Router | TanStack Router (file-based, type-safe) |
| API | tRPC + TanStack Query |
| Database | Neon Postgres + Drizzle ORM |
| Auth | better-auth (Google OAuth + email/password) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Charts | Recharts |
| Monitoring | Sentry |
| Deployment | Vercel (Edge Functions) |

---

## Project Structure

```
my-tanstack-app/
├── src/
│   ├── routes/           # File-based routing
│   │   ├── _app.tsx      # Authenticated layout (sidebar + auth guard)
│   │   ├── _app/         # Main app pages
│   │   │   ├── index.tsx         # Dashboard
│   │   │   ├── rankings.tsx      # Rankings Tracker
│   │   │   ├── reviews.tsx       # Review Manager
│   │   │   ├── citations.tsx     # Citation Manager
│   │   │   ├── locations.tsx     # Location Manager
│   │   │   ├── settings.tsx      # Settings
│   │   │   ├── website.tsx       # Website SEO Dashboard 🆕
│   │   │   └── website/          # Website SEO pages 🆕
│   │   └── login.tsx     # Login page
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── Sidebar.tsx   # Main navigation
│   │   └── BountyLogo.tsx
│   ├── db/
│   │   ├── schema.ts     # Drizzle schema (5 SEO tables)
│   │   ├── index.ts      # Database instance
│   │   └── seed.ts       # Sample data seeder
│   ├── integrations/
│   │   ├── trpc/         # tRPC API layer
│   │   ├── better-auth/  # Authentication
│   │   └── tanstack-query/
│   └── lib/              # Utilities + API integrations
│       ├── website-crawler.ts  # Website SEO crawler 🆕
│       └── sentry.ts           # Sentry utilities 🆕
├── scripts/              # CLI scripts
│   └── crawl-website.ts  # Website crawler CLI 🆕
├── AGENTS.md             # Complete project documentation
├── APP-GUIDE.md          # Feature guide & how-to
├── WEBSITE-SEO-COMPLETE.md # Website SEO module guide 🆕
└── package.json
```

---

## Features

### ✅ Fully Working Modules

#### Local SEO (Google Maps)
- **Dashboard** — KPI cards, trend charts, recent activity
- **Locations Manager** — Add/edit Bounty branches with stats
- **Rankings Tracker** — Track keyword positions on Google Maps (manual "Check Now" button)
- **Citation Manager** — Track directory listings & NAP consistency
- **Settings** — Business info, team management, data exports
- **Authentication** — Google OAuth + email/password with session persistence

#### Website SEO (bountybasket.online) 🆕
- **Website Dashboard** (`/website`) — Overall SEO score, pages analyzed, issues
- **Pages Analysis** (`/website/pages`) — Crawl results, scores, metadata
- **Page Details** (`/website/pages/$pageId`) — Full SEO analysis per page
- **Issues Manager** (`/website/issues`) — Track & resolve SEO problems
- **Backlinks Tracker** (`/website/backlinks`) — Monitor inbound links
- **Site Crawler** — 20+ automated SEO checks (run via CLI)

### ⏸ Partially Working (Manual Only)
- **Review Manager** — UI complete, but needs Google Business Profile API for automated sync
  - Can reply to reviews (stored in database)
  - Can mark reviews as resolved
  - Need GBP API key to auto-fetch reviews

---

## Environment Variables

Required variables in `.env.local`:

```env
# Database (Required)
DATABASE_URL=postgresql://...

# Auth (Required)
BETTER_AUTH_SECRET=<random 32+ char string>
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>

# APIs (Optional but recommended)
GOOGLE_MAPS_API_KEY=<for ranking checks>
VITE_SENTRY_DSN=<for error tracking>
```

See `AGENTS.md` for complete setup guide.

---

## Database Schema

| Table | Purpose |
|---|---|
| `seo_locations` | Bounty branches (name, address, Google Place ID) |
| `seo_keywords` | Keywords to track per location |
| `seo_ranking_snapshots` | Historical Google Maps position data |
| `seo_reviews` | Customer reviews (Google/Facebook) |
| `seo_citations` | Business directory listings (NAP tracking) |
| `seo_settings` | Global business settings |
| **Website SEO Module (NEW):** |
| `seo_pages` | bountybasket.online pages (URL, title, meta, scores) |
| `seo_issues` | SEO problems per page (critical, warning, info) |
| `seo_keyword_rankings` | Website organic keyword positions |
| `seo_backlinks` | Inbound links to bountybasket.online |
| `seo_content_suggestions` | Content optimization ideas |
| `seo_competitor_analysis` | Competitor SEO metrics |
| `seo_audit_history` | Historical audit results |
| **Auth Tables:** |
| `user`, `session`, `account` | better-auth tables |

---

## What's NOT Working (Review Sync)

**Review syncing from Google is blocked** due to Google Business Profile API requirements:

1. **APIs must be enabled** in Google Cloud Console:
   - My Business Account Management API
   - My Business Business Information API
   - My Business Reviews API
   - Google Business Profile API

2. **OAuth scope required**: `https://www.googleapis.com/auth/business.manage`

3. **Account must have GBP access**: Your Google account must manage the Bounty Business Profiles

**Current status**: Review UI works, but "Sync All" button returns 403/429 errors until APIs are enabled.

**Workaround**: Manually add reviews to the database for testing.

---

## 🔐 Security & Access Control

### Role-Based Access Control (RBAC)

This app implements professional-grade role-based permissions:

| Role | Default | Permissions |
|------|---------|-------------|
| **Viewer** | ✅ New users | Read-only access to all data |
| **Staff** | Promote manually | Create/edit content, sync data, reply to reviews |
| **Admin** | Promote manually | Full access + settings + user management |

**Key Features:**
- ✅ **API-level enforcement** — tRPC middleware blocks unauthorized mutations
- ✅ **UI-level enforcement** — Buttons auto-disable based on permissions
- ✅ **Graceful error handling** — User-friendly messages, no crashes
- ✅ **Rate limiting** — Protects Google API quota (e.g., 10 rank checks per minute)
- ✅ **Input sanitization** — XSS prevention on all user inputs
- ✅ **Error tracking** — Sentry integration with email alerts

**Promoting users:**
```sql
-- Make user an admin (run in Drizzle Studio or database console)
UPDATE "user" SET role = 'admin' WHERE email = 'jwachira@ict.bountysupermarkets.co.ke';

-- Make user staff
UPDATE "user" SET role = 'staff' WHERE email = 'user@example.com';
```

**Or via UI:** Settings → Team Management (admin only)

**See full documentation:** [RBAC-GUIDE.md](./RBAC-GUIDE.md)

### Sentry Error Monitoring

**Setup email alerts:**
1. Add `VITE_SENTRY_DSN` to `.env.local`
2. Follow [SENTRY-SETUP.md](./SENTRY-SETUP.md) guide
3. Configure email: jwachira@ict.bountysupermarkets.co.ke

**What gets tracked:**
- Fatal errors (app crashes)
- API errors (Google API failures, database errors)
- Permission errors
- Performance issues (slow queries)

---

## 🐛 Troubleshooting

### "Star is not defined" Error (FIXED ✅)

**Error:**
```
ReferenceError: Star is not defined
at DashboardPage index.tsx:266
```

**Status:** Fixed in latest version (Star icon import added)

**Solution:** Pull latest code and refresh

### "You don't have permission" Error

**Error:**
```
❌ You don't have permission to: keywords.create
```

**Cause:** You're a Viewer (read-only) or don't have the required role

**Solution:**
1. Contact admin: jwachira@ict.bountysupermarkets.co.ke
2. Request Staff or Admin role
3. Admin promotes you via Settings → Team Management
4. Refresh page (Ctrl+R)

### Google Avatar Image Not Loading

**Error:** `NS_BINDING_ABORTED` for Google profile images

**Cause:** CORS/CSP issues with Google user avatars

**Solution:** This is a cosmetic issue — avatars fallback to initials (e.g., "JW")

### Rate Limit Exceeded

**Error:**
```
Rate limit exceeded. Please try again in 428 seconds.
```

**Cause:** You triggered an expensive operation too many times (e.g., clicked "Check Now" 15 times in 1 minute)

**Solution:**
- Wait for cooldown period
- Review rate limits: [RBAC-GUIDE.md](./RBAC-GUIDE.md)
- If urgent, ask admin to reset your rate limit

### Permission Changes Not Taking Effect

**Issue:** Admin changed your role, but you still can't access features

**Solution:**
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear session: Log out and log back in
3. Verify role change: Settings → Team → find your name

---

## Deployment

This app is configured for **Vercel**:

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables in Vercel settings
4. Deploy

The `vercel.json` and `vite.config.ts` are pre-configured.

---

## Support & Documentation

- **[AGENTS.md](./AGENTS.md)** — Complete technical documentation & architecture
- **[APP-GUIDE.md](./APP-GUIDE.md)** — Feature-by-feature user guide
- **[WEBSITE-SEO-COMPLETE.md](./WEBSITE-SEO-COMPLETE.md)** — Website SEO module guide
- **[RBAC-GUIDE.md](./RBAC-GUIDE.md)** — Role-based access control documentation
- **[SENTRY-SETUP.md](./SENTRY-SETUP.md)** — Error monitoring & email alerts setup

**Technical Support:**
- Email: jwachira@ict.bountysupermarkets.co.ke
- Include: Error message, steps to reproduce, your user role

---

Built with ❤️ for Bounty Supermarket Kenya

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

---

## Learn More

For TanStack specific documentation:
- [TanStack Start](https://tanstack.com/start)
- [TanStack Router](https://tanstack.com/router)
- [TanStack Query](https://tanstack.com/query)
