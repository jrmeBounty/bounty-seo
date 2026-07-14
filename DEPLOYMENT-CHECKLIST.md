# Production Deployment Checklist

**Before deploying this app to production, complete ALL items below.**

---

## 🔐 Security & Authentication

### Google OAuth Configuration

- [ ] **Google Cloud Console** setup complete
  - [ ] OAuth 2.0 Client ID created
  - [ ] Authorized redirect URIs added:
    - `https://yourdomain.com/api/auth/callback/google`
    - `http://localhost:3000/api/auth/callback/google` (for dev)
  - [ ] OAuth consent screen configured
  - [ ] Scopes added:
    - `openid`
    - `email`
    - `profile`
    - `https://www.googleapis.com/auth/business.manage`

- [ ] **Environment variables** set in production:
  ```env
  GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=GOCSPX-xxx
  BETTER_AUTH_SECRET=<32+ char random string>
  BETTER_AUTH_URL=https://yourdomain.com
  ```

- [ ] **Test OAuth flow** in production:
  - [ ] Can log in with Google
  - [ ] Session persists after refresh
  - [ ] Can log out successfully

---

## 🗄️ Database

- [ ] **Neon Postgres** database created
- [ ] **Connection string** added to production env:
  ```env
  DATABASE_URL=postgres://user:pass@host.neon.tech/db?sslmode=require
  DATABASE_URL_POOLER=postgres://user:pass@host-pooler.neon.tech/db?sslmode=require
  ```

- [ ] **Schema pushed** to production:
  ```bash
  bun run db:push
  # Or run migration:
  bun run db:migrate
  ```

- [ ] **First admin user** created:
  - [ ] Log in with your Google account
  - [ ] Connect to production database
  - [ ] Run: `UPDATE "user" SET role = 'admin' WHERE email = 'jwachira@ict.bountysupermarkets.co.ke';`
  - [ ] Refresh browser, verify admin access

---

## 🔑 API Keys

- [ ] **Google Maps API Key** configured:
  - [ ] Places API (New) enabled
  - [ ] Maps JavaScript API enabled
  - [ ] API key added to production env: `GOOGLE_MAPS_API_KEY=AIzaSy...`
  - [ ] API key restrictions set (HTTP referrers)

- [ ] **Google Business Profile API** enabled (for review sync):
  - [ ] My Business Account Management API
  - [ ] My Business Business Information API
  - [ ] My Business Reviews API
  - [ ] Google Business Profile API

- [ ] **Test API access**:
  - [ ] Run a keyword ranking check (manual "Check Now")
  - [ ] Verify it returns a position (not "API key not configured")

---

## 📊 Error Monitoring (Sentry)

- [ ] **Sentry project** created at https://sentry.io
- [ ] **DSN added** to production env:
  ```env
  VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
  NODE_ENV=production
  ```

- [ ] **Email alerts configured**:
  - [ ] Follow [SENTRY-SETUP.md](./SENTRY-SETUP.md)
  - [ ] Alert rule created: "Critical Errors - Email Notification"
  - [ ] Email address: jwachira@ict.bountysupermarkets.co.ke
  - [ ] Notification settings verified (User Settings → Notifications)

- [ ] **Test error tracking**:
  - [ ] Trigger a test error in production
  - [ ] Verify error appears in Sentry dashboard
  - [ ] Verify email alert received

---

## 👥 User Management

- [ ] **Admin accounts** created:
  - [ ] jwachira@ict.bountysupermarkets.co.ke → `admin`
  - [ ] *(Add other admins here)* → `admin`

- [ ] **Staff accounts** identified:
  - [ ] *(List staff members who need editing access)* → `staff`

- [ ] **Role assignment** via Settings → Team Management
  - [ ] All admins promoted
  - [ ] All staff promoted
  - [ ] Everyone else remains `viewer` (read-only)

- [ ] **Test permissions**:
  - [ ] Log in as viewer → verify buttons disabled
  - [ ] Log in as staff → verify can edit, cannot delete
  - [ ] Log in as admin → verify full access

---

## 🌍 Google Business Profile Setup

- [ ] **Google account** has GBP manager access:
  - [ ] Can access https://business.google.com
  - [ ] Can see all Bounty Supermarket locations
  - [ ] Can manage reviews

- [ ] **OAuth consent** includes GBP scope:
  - [ ] Scope: `https://www.googleapis.com/auth/business.manage`
  - [ ] Re-login required if scope was added later

- [ ] **Locations added** to app:
  - [ ] Go to Locations → Add Location
  - [ ] For each Bounty branch:
    - [ ] Name (e.g., "Bounty Supermarket - Barnabas")
    - [ ] Address
    - [ ] City
    - [ ] Phone
    - [ ] Google Place ID (from Google Maps URL)

- [ ] **Test review sync**:
  - [ ] Click "Sync Now" on dashboard
  - [ ] Verify reviews appear in Reviews page
  - [ ] If 403 error, check GBP API access

---

## 🎯 SEO Tracker Configuration

- [ ] **Keywords added**:
  - [ ] Go to Rankings → Add Keyword
  - [ ] Add 5-10 important keywords per location
  - [ ] Examples: "supermarket nakuru", "bounty supermarket"

- [ ] **Test ranking check**:
  - [ ] Click "Check Now" next to a keyword
  - [ ] Verify position is returned (not "API key not configured")
  - [ ] Check position shows on dashboard

- [ ] **Citations added**:
  - [ ] Go to Citations → Add Citation
  - [ ] Add major directories (Yellow Pages, Google Maps)
  - [ ] Test "Check Now" (currently simulated)

- [ ] **Website SEO crawled**:
  ```bash
  bun run crawl:website https://bountybasket.online --full
  ```
  - [ ] Verify pages appear in Website SEO → Pages
  - [ ] Verify issues appear in Website SEO → Issues

---

## 🚀 Deployment (Vercel)

- [ ] **Vercel project** created
- [ ] **GitHub repo** connected
- [ ] **Environment variables** set in Vercel dashboard:
  - [ ] All variables from `.env.example`
  - [ ] `NODE_ENV=production`

- [ ] **Build settings**:
  - [ ] Framework Preset: Other
  - [ ] Build Command: `bun run build`
  - [ ] Output Directory: `.vercel/output`
  - [ ] Install Command: `bun install`

- [ ] **Domain configured**:
  - [ ] Custom domain added (e.g., `seo.bountysupermarkets.co.ke`)
  - [ ] SSL certificate active
  - [ ] `BETTER_AUTH_URL` updated to production domain

- [ ] **First deployment**:
  - [ ] Push to `main` branch
  - [ ] Deployment succeeds
  - [ ] Site loads at production URL

---

## ✅ Post-Deployment Testing

### Smoke Tests

- [ ] **Homepage loads** (https://yourdomain.com)
- [ ] **Login works** with Google OAuth
- [ ] **Dashboard loads** with live data
- [ ] **Navigation works** (all sidebar links)

### Functionality Tests

- [ ] **Rankings Tracker**:
  - [ ] Can view keywords
  - [ ] Can add keyword (as staff/admin)
  - [ ] Can check ranking (as staff/admin)
  - [ ] Position updates in database

- [ ] **Reviews Manager**:
  - [ ] Can view reviews
  - [ ] Can reply to review (as staff/admin)
  - [ ] Can mark as resolved (as staff/admin)
  - [ ] Sync works (if GBP API enabled)

- [ ] **Citations Manager**:
  - [ ] Can view citations
  - [ ] Can add citation (as staff/admin)
  - [ ] NAP score calculated

- [ ] **Location Manager**:
  - [ ] Can view locations
  - [ ] Can add location (as staff/admin)
  - [ ] Can edit location (as staff/admin)

- [ ] **Website SEO**:
  - [ ] Dashboard shows stats
  - [ ] Pages list loads
  - [ ] Issues list loads
  - [ ] Backlinks list loads

### RBAC Tests

- [ ] **Viewer role**:
  - [ ] Can view all pages
  - [ ] All mutation buttons disabled
  - [ ] Tooltips explain why disabled
  - [ ] Banner shows "Read-Only Access"

- [ ] **Staff role**:
  - [ ] Can create/edit keywords
  - [ ] Can reply to reviews
  - [ ] Can sync data
  - [ ] Cannot delete locations
  - [ ] Cannot access Settings

- [ ] **Admin role**:
  - [ ] Full access to everything
  - [ ] Can access Settings
  - [ ] Can manage team
  - [ ] Can trigger full sync

### Error Handling Tests

- [ ] **Rate limits**:
  - [ ] Click "Check Now" 15 times quickly
  - [ ] Verify rate limit error shows
  - [ ] Error message shows retry time

- [ ] **Permission errors**:
  - [ ] Log in as viewer
  - [ ] Try to create keyword via API (should fail)
  - [ ] Error message: "You don't have permission"

- [ ] **Error tracking**:
  - [ ] Trigger a test error (throw from console)
  - [ ] Error appears in Sentry
  - [ ] Email alert received

---

## 📱 Communication

### Notify Team

- [ ] **Email sent** to all users:
  - [ ] Production URL
  - [ ] Login instructions
  - [ ] Role assignments
  - [ ] Support contact (jwachira@ict.bountysupermarkets.co.ke)

- [ ] **Training provided** (if needed):
  - [ ] Dashboard walkthrough
  - [ ] How to add keywords
  - [ ] How to reply to reviews
  - [ ] How to export data

### Documentation

- [ ] **README.md** updated with production URL
- [ ] **RBAC-GUIDE.md** shared with team
- [ ] **Support email** confirmed: jwachira@ict.bountysupermarkets.co.ke

---

## 🔄 Maintenance

### Daily

- [ ] **Check Sentry** for new errors
- [ ] **Monitor review sync** status

### Weekly

- [ ] **Review user access** (Settings → Team)
- [ ] **Check API quotas** (Google Cloud Console)
- [ ] **Export data** for backup

### Monthly

- [ ] **Database backup** (Neon auto-backup enabled?)
- [ ] **Audit user roles** (remove inactive users)
- [ ] **Review rate limits** (adjust if needed)

---

## 🆘 Emergency Contacts

**Primary:** jwachira@ict.bountysupermarkets.co.ke  
**Sentry:** https://sentry.io → Your Project  
**Vercel:** https://vercel.com → Your Project  
**Neon:** https://console.neon.tech → Your Database  

---

## ✅ Final Sign-Off

**Deployment completed by:** _________________  
**Date:** _________________  
**Production URL:** _________________  
**All checklist items verified:** ☐ Yes ☐ No

**Notes:**
```
(Add any deployment notes, known issues, or special configuration here)
```

---

**Congratulations! Your Bounty Supermarket SEO Tracker is now live! 🎉**
