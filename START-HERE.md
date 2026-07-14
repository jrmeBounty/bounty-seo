# 🚀 Bounty Supermarket SEO Tracker — Quick Start

**All errors fixed. Ready to run and deploy!**

---

## ⚡ Start Development Server

```bash
# Navigate to project
cd C:\Users\JRME\Documents\WorkProjects\APP\my-tanstack-app

# Start server
bun run dev
```

**Expected output:**
```
✅ Sentry initialized for development environment
VITE v8.0.10 ready in 6245 ms
➜ Local: http://localhost:3000/
```

**Open browser:** http://localhost:3000

---

## ✅ What Was Fixed

### 1. **Sentry Error** ❌ → ✅
- **Error:** `browserTracingIntegration is not a function`
- **Fix:** Removed browser-only integrations from server file
- **File:** `instrument.server.mjs`

### 2. **tRPC Middleware Error** ❌ → ✅
- **Error:** `Cannot use 'in' operator to search for '_middlewares'`
- **Fix:** Fixed middleware chaining in 3 procedures
- **File:** `src/integrations/trpc/router.ts`

### 3. **Dashboard Crash** ❌ → ✅
- **Error:** `Star is not defined`
- **Fix:** Added missing import
- **File:** `src/routes/_app/index.tsx`

### 4. **Vercel Deployment Error** ❌ → ✅
- **Error:** `Cannot find package 'react'`
- **Fix:** Configured Vite to bundle React into server code
- **File:** `vite.config.ts`

---

## 📚 Key Documentation

| Document | Purpose |
|----------|---------|
| **[VERCEL-DEPLOYMENT.md](./VERCEL-DEPLOYMENT.md)** | 🚀 **Deploy to production** (includes React bundle fix) |
| **[FIXES-APPLIED.md](./FIXES-APPLIED.md)** | All errors fixed + troubleshooting |
| **[RBAC-GUIDE.md](./RBAC-GUIDE.md)** | Role permissions (Viewer, Staff, Admin) |
| **[SENTRY-SETUP.md](./SENTRY-SETUP.md)** | Email alerts for critical errors |
| **[DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)** | Production deployment checklist |
| **[README.md](./README.md)** | Complete project documentation |

---

## 🔐 First-Time Setup

### 1. **Sign In**
```bash
# Start server
bun run dev

# Open: http://localhost:3000
# Click: "Sign In with Google"
```

### 2. **Promote Yourself to Admin**
```bash
# Open database GUI
bun run db:studio

# Find your user in "user" table
# Change role from "viewer" to "admin"
# Or run SQL:
# UPDATE "user" SET role = 'admin' WHERE email = 'your@email.com';
```

### 3. **Add First Location**
```
1. Refresh browser (Ctrl+R)
2. Go to Locations page
3. Click "Add Location"
4. Fill in:
   - Name: Bounty Supermarket - Barnabas | Nakuru
   - Address: 123 Barnabas Road, Nakuru
   - City: Nakuru
   - Phone: +254 20 222 1234
   - Google Place ID: (get from Google Maps URL)
5. Click Save
```

### 4. **Add First Keyword**
```
1. Go to Rankings page
2. Click "Add Keyword"
3. Fill in:
   - Term: supermarket nakuru
   - Location: Barnabas
   - Category: Local
4. Click Save
```

### 5. **Check Ranking**
```
1. Find keyword in list
2. Click "Check Now" button
3. Wait 5-10 seconds
4. Position appears (e.g., #3)
```

**Done!** 🎉 You're now tracking rankings.

---

## 🚀 Deploy to Vercel

### Quick Deploy
```bash
# 1. Push to GitHub
git add .
git commit -m "Production ready"
git push origin main

# 2. Go to: https://vercel.com/new
# 3. Import your GitHub repository
# 4. Add environment variables (see .env.example)
# 5. Click Deploy
```

### Required Environment Variables in Vercel
```env
DATABASE_URL=postgres://...
BETTER_AUTH_SECRET=<32+ char random>
BETTER_AUTH_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_MAPS_API_KEY=AIzaSy...
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx (optional)
NODE_ENV=production
```

**Full guide:** [FIXES-APPLIED.md](./FIXES-APPLIED.md)

---

## 🧪 Verify Everything Works

```bash
# 1. Check RBAC permissions
bun run verify:rbac
# Expected: ✅ All RBAC constraints are correctly configured!

# 2. Check code quality
bun run check
# Expected: No errors (might take 1-2 minutes)

# 3. Start dev server
bun run dev
# Expected: Opens at http://localhost:3000
```

---

## 🎯 Common Tasks

### Run Website SEO Crawler
```bash
# Crawl homepage
bun run crawl:website https://bountybasket.online

# Crawl common pages (home, about, shop, etc.)
bun run crawl:website --full
```

### Export Data
```bash
# Via UI: Go to any page → Click "Export" button
# Downloads CSV file with data
```

### Manage User Roles
```bash
# Via UI: Settings → Team Management
# Change dropdown: Viewer / Staff / Admin
# (Admin only)
```

---

## 📞 Need Help?

### Development Issues
- **Error logs:** Check terminal where `bun run dev` is running
- **Database errors:** Run `bun run db:studio` to inspect data
- **Permission errors:** Check user role in database

### Production Issues
- **Vercel logs:** `vercel logs [deployment-url]`
- **Sentry errors:** https://sentry.io → Your Project
- **Contact:** jwachira@ict.bountysupermarkets.co.ke

---

## ⭐ Quick Reference

### Development Commands
```bash
bun run dev          # Start dev server
bun run db:studio    # Open database GUI
bun run verify:rbac  # Test permissions
bun run check        # Lint & format check
```

### Database Commands
```bash
bun run db:push      # Push schema changes
bun run db:migrate   # Run migrations
bun run db:seed      # Add sample data
```

### Build Commands
```bash
bun run build        # Production build
bun run start        # Run production build locally
```

---

## 🎉 You're All Set!

**Next steps:**
1. ✅ Start dev server: `bun run dev`
2. ✅ Sign in with Google
3. ✅ Promote to admin (via database)
4. ✅ Add locations
5. ✅ Add keywords
6. ✅ Check rankings
7. ✅ Deploy to Vercel

**Everything is working and ready for production!** 🚀

---

**Status:** ✅ All errors fixed  
**Build:** ✅ Passing  
**Deployment:** ✅ Vercel ready  
**Documentation:** ✅ Complete
