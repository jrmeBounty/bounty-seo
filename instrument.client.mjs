import * as Sentry from '@sentry/tanstackstart-react'

const sentryDsn = import.meta.env?.VITE_SENTRY_DSN

if (!sentryDsn) {
  console.warn('VITE_SENTRY_DSN is not defined. Sentry is not running.')
} else {
  Sentry.init({
    dsn: sentryDsn,
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // Adjust this value in production
    tracesSampleRate: 1.0,

    // Session Replay - captures 100% of sessions in dev
    // Adjust these values in production
    replaysSessionSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,

    // Integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
  })
}
