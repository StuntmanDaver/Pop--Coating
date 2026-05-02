import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    typedRoutes: true,
  },
}

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  tunnelRoute: '/monitoring',
})
