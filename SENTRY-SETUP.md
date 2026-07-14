# Sentry Email Alerts Setup Guide

This guide will help you configure Sentry to send email notifications for critical errors to jwachira@ict.bountysupermarkets.co.ke.

## Prerequisites

1. A Sentry account (sign up at https://sentry.io if you don't have one)
2. Your `VITE_SENTRY_DSN` configured in `.env.local`

## Step 1: Configure Email Alerts in Sentry Dashboard

### 1.1 Access Alert Settings

1. Log in to Sentry (https://sentry.io)
2. Navigate to your project: **Bounty Supermarket SEO Tracker**
3. Click **Settings** in the left sidebar
4. Click **Alerts** under the Project Settings section

### 1.2 Create a New Alert Rule

1. Click **Create Alert Rule**
2. Choose **Issues** as the alert type
3. Configure the alert with these settings:

   **Alert Name:** `Critical Errors - Email Notification`
   
   **Environment:** `production` (so dev errors don't spam you)
   
   **Conditions:**
   ```
   When an event is captured by Sentry
   AND The issue's level is equal to fatal OR error
   AND The event is first seen
   ```
   
   **Action:**
   ```
   Send a notification via Email
   To: jwachira@ict.bountysupermarkets.co.ke
   ```

4. Click **Save Rule**

### 1.3 Create Additional Alert Rules (Optional but Recommended)

#### High-Frequency Error Alert
This alerts when the same error happens multiple times quickly.

**Alert Name:** `High Frequency Errors`

**Conditions:**
```
When an event is captured by Sentry
AND The issue's level is equal to error
AND The issue is seen more than 10 times in 1 hour
```

**Action:** Email to jwachira@ict.bountysupermarkets.co.ke

#### Performance Degradation Alert
This alerts when API calls become slow.

**Alert Name:** `Slow API Performance`

**Conditions:**
```
When the average duration for transactions matching the filter is above 3000ms in 10 minutes
AND The transaction name matches: api.trpc.*
```

**Action:** Email to jwachira@ict.bountysupermarkets.co.ke

## Step 2: Configure User Settings

1. Click your profile icon (top right)
2. Go to **User Settings**
3. Click **Notifications** in the left sidebar
4. Under **Email**, ensure these are enabled:
   - ✅ Issue Alerts
   - ✅ Workflow Notifications
   - ✅ Deploy Notifications
   - ✅ Weekly Reports (optional)

## Step 3: Test the Email Alerts

### 3.1 Trigger a Test Error

Run this in your browser console while on the dashboard:

```javascript
throw new Error('TEST: Sentry email alert verification');
```

### 3.2 Verify Email Delivery

1. Check your inbox at jwachira@ict.bountysupermarkets.co.ke
2. You should receive an email within 1-2 minutes with subject: `[Bounty Supermarket SEO Tracker] TEST: Sentry email alert verification`
3. If you don't receive it, check:
   - Spam/junk folder
   - Sentry notification settings (Step 2)
   - Alert rule configuration (Step 1.2)

## Step 4: Set Up Slack Integration (Optional)

For faster notifications, you can also send alerts to Slack:

1. In Sentry project settings, go to **Integrations**
2. Search for **Slack**
3. Click **Add to Slack**
4. Choose your workspace and channel (e.g., `#seo-alerts`)
5. Update your alert rules to include Slack notifications

## Email Alert Examples

### What You'll Receive

**Critical Error Email:**
```
Subject: [Bounty Supermarket SEO Tracker] Error: Google Business Profile API error: 403 Forbidden

❌ New Issue in production

Error: Google Business Profile API error: 403 Forbidden
  at syncGoogleReviews (google-business.ts:142)
  
User: user_abc123
Location: Barnabas Branch
Timestamp: 2026-07-13 14:32:05
Environment: production

View Issue: [Link to Sentry]
```

**High-Frequency Error Email:**
```
Subject: [Bounty Supermarket SEO Tracker] High Frequency: Rate limit exceeded

⚠️ Spike Alert

The issue "Rate limit exceeded. Please try again in 599 seconds." 
has occurred 15 times in the last hour.

This might indicate:
- A user repeatedly triggering sync operations
- A bot attempting to spam the API
- A frontend bug causing repeated requests

View Issue: [Link to Sentry]
```

## Alert Severity Levels

Sentry will send emails for these error levels:

| Level | When It Fires | Example |
|-------|---------------|---------|
| **fatal** | App crash, unrecoverable error | Database connection failed, auth system down |
| **error** | Recoverable errors, failed operations | API call failed, sync operation error |
| **warning** | Not emailed by default | Deprecated API usage, missing optional config |
| **info** | Not emailed | Performance metrics, audit logs |

## Quiet Hours (Optional)

To avoid getting alerts at night:

1. Sentry Settings → Alerts
2. For each alert rule, click **Edit**
3. Scroll to **Action Frequency**
4. Select **Custom Frequency**
5. Set quiet hours: 10 PM - 7 AM (Kenya time)

## Team Collaboration

To add more team members to receive alerts:

1. Sentry Settings → Members
2. Click **Invite Member**
3. Enter email address
4. Assign role: **Member** (can view issues) or **Admin** (can manage settings)
5. In Alert Rules, add their email to the notification list

## Monitoring Checklist

After setup, verify these work:

- [ ] Critical errors send email immediately
- [ ] Email arrives at jwachira@ict.bountysupermarkets.co.ke
- [ ] Email contains stack trace and user context
- [ ] Emails don't fire for dev environment errors
- [ ] High-frequency errors are detected
- [ ] Performance alerts fire when API is slow

## Troubleshooting

### Not Receiving Emails?

1. **Check Sentry inbox**: Sentry → Settings → Notifications → ensure "Email" is enabled
2. **Verify email in Sentry profile**: Your email must be verified in Sentry
3. **Check alert rule environment filter**: Ensure it matches your deployment (production)
4. **Test with manual error**: Use the browser console test (Step 3.1)

### Too Many Emails?

1. **Increase threshold**: Edit alert rule → Change "first seen" to "seen more than X times"
2. **Add environment filter**: Only alert on production, not staging/dev
3. **Enable quiet hours**: Set 10 PM - 7 AM as quiet period
4. **Group similar errors**: Sentry automatically groups similar errors — ensure grouping is working

## Next Steps

After email alerts are working:

1. Set up **Slack integration** for real-time notifications
2. Configure **weekly summary emails** for error trends
3. Set up **performance monitoring** for slow API calls
4. Create **custom dashboards** in Sentry for team visibility

## Support

- **Sentry Documentation**: https://docs.sentry.io/product/alerts/
- **Email Alerts Guide**: https://docs.sentry.io/product/alerts/alert-types/#issue-alerts
- **Your Sentry Project**: https://sentry.io/organizations/[your-org]/projects/bounty-supermarket-seo-tracker/

---

**Last Updated**: January 2026  
**Maintained By**: Bounty Supermarket IT Team
