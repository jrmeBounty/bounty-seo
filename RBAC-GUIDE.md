# Role-Based Access Control (RBAC) Guide

This application implements a comprehensive Role-Based Access Control system to manage user permissions across all features.

## User Roles

### 1. **Viewer** (Default Role)
- **Purpose**: Read-only access for stakeholders who need to monitor SEO performance
- **Use Case**: Management, external consultants, auditors

**Permissions:**
- ✅ View all dashboards and reports
- ✅ View locations, keywords, rankings
- ✅ View reviews and citations
- ✅ View website SEO data
- ❌ **Cannot** create, update, or delete anything
- ❌ **Cannot** sync with Google APIs
- ❌ **Cannot** reply to reviews
- ❌ **Cannot** export data

**UI Behavior:**
- Banner at top of pages: "Read-Only Access"
- All mutation buttons disabled with tooltip
- Forms and inputs grayed out

### 2. **Staff**
- **Purpose**: Day-to-day SEO management and operations
- **Use Case**: SEO specialists, marketing team members

**Permissions:**
- ✅ Everything viewers can do, PLUS:
- ✅ Create and update locations
- ✅ Add, update, delete keywords
- ✅ Check rankings manually
- ✅ Reply to reviews
- ✅ Mark reviews as resolved
- ✅ Sync reviews from Google
- ✅ Add and check citations
- ✅ Manage website SEO pages
- ✅ Resolve SEO issues
- ✅ Export data
- ❌ **Cannot** delete locations
- ❌ **Cannot** change settings
- ❌ **Cannot** manage user roles
- ❌ **Cannot** trigger full sync

**UI Behavior:**
- Full access to data management features
- "Sync All" button hidden
- Settings page shows "Admin Only" message

### 3. **Admin**
- **Purpose**: Full system control and configuration
- **Use Case**: IT team, system administrators

**Permissions:**
- ✅ **Everything** — no restrictions
- ✅ Delete locations
- ✅ Update global settings
- ✅ Manage user roles
- ✅ Trigger full sync with Google APIs
- ✅ Access team management

**UI Behavior:**
- All features enabled
- Access to Settings page
- Access to Team Management
- Can promote/demote other users

## How Role Enforcement Works

### 1. **Database Level**
The `user` table stores the role:

```sql
CREATE TABLE "user" (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer', -- "admin" | "staff" | "viewer"
  ...
);
```

### 2. **API Level (tRPC Middleware)**
Every mutation is protected by middleware:

```typescript
// Example: Only staff and admins can create keywords
keywords.create: requirePermission("keywords.create")
  .input(z.object({ term: z.string(), ... }))
  .mutation(async ({ input }) => {
    // This code only runs if user has permission
    ...
  })
```

**What happens when permission is denied:**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to: keywords.create"
  }
}
```

### 3. **UI Level (React Components)**
Buttons and forms automatically disable based on permissions:

```tsx
// Automatically disables for viewers
<PermissionAwareButton permission="keywords.create">
  Add Keyword
</PermissionAwareButton>

// Shows tooltip: "Read-only access - contact admin for editing permissions"
```

### 4. **Rate Limiting**
Even with permissions, expensive operations are rate-limited:

| Operation | Limit | Window |
|-----------|-------|--------|
| Google Maps rank check | 10 requests | 1 minute |
| Review sync | 5 requests | 1 hour |
| Citation check | 10 requests | 1 hour |
| Full sync | 1 request | 10 minutes |

**What happens when rate limit is exceeded:**
```json
{
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Rate limit exceeded. Please try again in 428 seconds."
  }
}
```

## Permission Matrix

| Feature | Viewer | Staff | Admin |
|---------|--------|-------|-------|
| **Dashboard** |
| View stats | ✅ | ✅ | ✅ |
| **Locations** |
| View locations | ✅ | ✅ | ✅ |
| Create location | ❌ | ✅ | ✅ |
| Update location | ❌ | ✅ | ✅ |
| Delete location | ❌ | ❌ | ✅ |
| **Keywords** |
| View keywords | ✅ | ✅ | ✅ |
| Add keyword | ❌ | ✅ | ✅ |
| Update keyword | ❌ | ✅ | ✅ |
| Delete keyword | ❌ | ❌ | ✅ |
| **Rankings** |
| View rankings | ✅ | ✅ | ✅ |
| Check now (manual) | ❌ | ✅ | ✅ |
| **Reviews** |
| View reviews | ✅ | ✅ | ✅ |
| Reply to review | ❌ | ✅ | ✅ |
| Mark resolved | ❌ | ✅ | ✅ |
| Sync from Google | ❌ | ✅ | ✅ |
| Auto-tag sentiment | ❌ | ✅ | ✅ |
| **Citations** |
| View citations | ✅ | ✅ | ✅ |
| Add citation | ❌ | ✅ | ✅ |
| Check citation | ❌ | ✅ | ✅ |
| **Website SEO** |
| View pages | ✅ | ✅ | ✅ |
| Add page | ❌ | ✅ | ✅ |
| Resolve issues | ❌ | ✅ | ✅ |
| Add backlink | ❌ | ✅ | ✅ |
| **Data** |
| Export CSV | ❌ | ✅ | ✅ |
| Sync all locations | ❌ | ❌ | ✅ |
| **Settings** |
| View settings | ✅ | ✅ | ✅ |
| Update settings | ❌ | ❌ | ✅ |
| **Team** |
| View users | ✅ | ✅ | ✅ |
| Change user roles | ❌ | ❌ | ✅ |

## Managing User Roles

### As an Admin, Assigning Roles:

1. **Navigate to Settings** → Click "Team Management" in sidebar
2. **View all users** → See list with current roles
3. **Change a role:**
   - Click the dropdown next to user's name
   - Select new role: Admin / Staff / Viewer
   - Click "Update"
   - User's permissions update immediately (no re-login required)

### For New Users:

When someone signs in with Google for the first time:
1. **Default role**: `viewer` (read-only)
2. **Admins notified** (if email alerts configured)
3. **Admin promotes them** to Staff or Admin as needed

### Security Best Practices:

1. **Principle of Least Privilege**: Give users only the permissions they need
   - Marketing team → Staff
   - Consultants reviewing data → Viewer
   - IT / System admins → Admin

2. **Regular audits**: Review user list quarterly
   - Remove users who left the company
   - Demote users who changed roles
   - Promote users who need more access

3. **Admin account security**:
   - Only 2-3 admins maximum
   - Use strong Google accounts with 2FA enabled
   - Never share admin accounts

## Troubleshooting

### "You don't have permission" Error

**Viewer sees this:**
```
❌ You don't have permission to: keywords.create
```

**Solution:**
1. Contact your administrator: jwachira@ict.bountysupermarkets.co.ke
2. Request Staff role if you need editing access
3. Administrator will review and upgrade if appropriate

### Button is Disabled

**What you see:**
- Grayed out button
- Hover shows tooltip: "Read-only access - contact admin for editing permissions"

**Why:**
- You're a Viewer (read-only role)
- Your session hasn't refreshed after role upgrade

**Solution:**
- Refresh the page (Ctrl+R or Cmd+R)
- If still disabled, verify your role in Settings → Team

### "Rate limit exceeded" Error

**What happened:**
- You triggered an expensive operation too many times
- Example: Clicked "Check Now" 15 times in 1 minute

**Solution:**
- Wait for the cooldown period (shown in error message)
- If urgent, contact an admin to reset your rate limit

### Role Change Not Taking Effect

**Issue:** Admin changed your role, but you still can't access features

**Solution:**
1. **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Clear session**: Log out and log back in
3. **Check browser console**: Press F12, look for auth errors
4. **Verify role change**: Go to Settings → Team → find your name

## API Integration Implications

### Google Business Profile API

**Problem**: Person only manages 1 of 3 Bounty branches

**Behavior:**
- ✅ Their branch: Reviews sync successfully
- ⚠️ Other branches: Silently skipped (no sync)
- ✅ No crash: Partial sync completes gracefully

**Why:**
- Google OAuth permissions are **per-account**, not per-role
- Admin role ≠ Google Business Profile manager
- You need **both** to sync reviews

**Solution:**
- Use a Google account that manages ALL branches
- Or: Have different staff members with different Google accounts, each syncs their branches

### Rate Limits are Per-User

If 3 staff members all click "Check Rankings" simultaneously:
- ✅ All requests succeed (each has their own rate limit quota)
- ❌ One person clicking 10 times quickly → rate limited

## Developer Notes

### Adding a New Permission

1. **Define permission** in `src/lib/rbac.ts`:
```typescript
export const permissions = {
  // ... existing
  "reports.generate": ["staff", "admin"], // NEW
} as const;
```

2. **Protect tRPC procedure** in `src/integrations/trpc/router.ts`:
```typescript
generateReport: requirePermission("reports.generate")
  .input(z.object({ ... }))
  .mutation(async ({ input }) => {
    // Implementation
  })
```

3. **Update UI component**:
```tsx
<PermissionAwareButton permission="reports.generate">
  Generate Report
</PermissionAwareButton>
```

4. **Update this guide**: Add to Permission Matrix table

### Testing Permissions

```typescript
// In browser console
localStorage.setItem('test-role', 'viewer'); // or 'staff' or 'admin'
location.reload();
```

Then navigate through the app and verify:
- Buttons are disabled/enabled correctly
- API calls return proper errors
- Tooltips show helpful messages

---

**Last Updated**: January 2026  
**Maintained By**: Bounty Supermarket IT Team
