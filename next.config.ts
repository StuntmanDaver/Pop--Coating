import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    typedRoutes: true,
  },
}

export default withSentryConfig(nextConfig, {
  // Sentry organization and project — match the DSN target.
  org: 'pop-coating',
  project: 'javascript-nextjs',

  // Only print logs for uploading source maps in CI.
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces.
  widenClientFileUpload: true,

  // Route browser Sentry requests through a Next.js rewrite to bypass ad-blockers.
  // Coordinated with src/proxy.ts so the matcher does not intercept /monitoring.
  tunnelRoute: '/monitoring',

  // Tree-shake Sentry's debug logging out of production bundles.
  // (Replaces the older `disableLogger: true` shorthand.)
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
})
