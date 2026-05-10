import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  // Tag every event with tenant_id when the JWT is available; per-request enrichment
  // happens via Sentry.setTag('tenant_id', claims.tenant_id) inside Server Actions.
  environment: process.env.VERCEL_ENV ?? 'development',
})
