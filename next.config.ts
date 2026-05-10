import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typedRoutes: true,
}

export default withSentryConfig(nextConfig, {
  silent: true,
  tunnelRoute: '/monitoring',
})
