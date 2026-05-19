// src/shared/rate-limit/index.ts
// @upstash/ratelimit sliding-window. Configs per docs/DESIGN.md §5.3, §5.5.
// Consumed by BOTH:
//   - src/proxy.ts edge layer (per-IP) — defense-in-depth per RESEARCH.md Architectural Responsibility Map
//   - Server Actions in Plan 05 (per-email + (IP, email)) — fine-grained per-action layer
import { Ratelimit } from '@upstash/ratelimit'
import { redis } from './adapter'

type RateLimiter = Pick<Ratelimit, 'limit'>

const passThroughLimiter: RateLimiter = {
  async limit() {
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
      pending: Promise.resolve(),
    }
  },
}

const authRateLimitsDisabled =
  process.env.AUTH_RATE_LIMIT_DISABLED === 'true' ||
  process.env.VERCEL_ENV === 'preview' ||
  process.env.NODE_ENV === 'development'

function createRateLimiter(options: ConstructorParameters<typeof Ratelimit>[0]): RateLimiter {
  if (authRateLimitsDisabled) return passThroughLimiter
  return new Ratelimit(options)
}

// Sign-in: 5 attempts per hour per (IP, email) compound key (Server Action use)
// Plus per-IP edge-layer use in src/proxy.ts.
export const signInLimiter = createRateLimiter({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'rl:signin',
  analytics: true,
})

// Magic link: 5 per hour per email
export const magicLinkPerEmailLimiter = createRateLimiter({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'rl:maglink:email',
  analytics: true,
})

// Magic link: 10 per hour per IP (defense vs distributed enumeration; also used by proxy.ts)
export const magicLinkPerIpLimiter = createRateLimiter({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'rl:maglink:ip',
  analytics: true,
})
