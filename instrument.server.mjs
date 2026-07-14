import * as Sentry from '@sentry/tanstackstart-react'

const sentryDsn = import.meta.env?.VITE_SENTRY_DSN ?? process.env.VITE_SENTRY_DSN

if (!sentryDsn) {
  console.warn('VITE_SENTRY_DSN is not defined. Sentry is not running.')
} else {
  Sentry.init({
    dsn: sentryDsn,
    
    // Environment detection
    environment: process.env.NODE_ENV || 'development',
    
    // Adds request headers and IP for users, for more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#sendDefaultPii
    sendDefaultPii: true,
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in production, 100% in dev
    
    // Session replay
    replaysSessionSampleRate: 0.1, // 10% of all sessions
    replaysOnErrorSampleRate: 1.0, // 100% of error sessions
    
    // Filter out sensitive data
    beforeSend(event, hint) {
      // Don't send events in development unless it's a critical error
      if (process.env.NODE_ENV === 'development' && event.level !== 'fatal' && event.level !== 'error') {
        return null
      }
      
      // Filter out sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.Authorization
        delete event.request.headers.Cookie
      }
      
      // Filter out database URLs from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.message) {
            breadcrumb.message = breadcrumb.message.replace(/postgres:\/\/[^@]+@[^/]+/g, 'postgres://***:***@***/***')
          }
          return breadcrumb
        })
      }
      
      return event
    },
    
    // Server-side integrations only
    // Note: Browser integrations (browserTracingIntegration, replayIntegration)
    // are automatically added by Sentry in the browser context
    integrations: [],
    
    // Ignore common non-critical errors
    ignoreErrors: [
      // Browser extensions
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      // Network errors that are expected
      'NetworkError',
      'Failed to fetch',
      'Load failed',
      // Safari-specific
      'AbortError',
      // Chrome extensions
      'chrome-extension://',
      'moz-extension://',
    ],
  })
  
  console.log(`✅ Sentry initialized for ${process.env.NODE_ENV || 'development'} environment`)
}
