// src/proxy.ts
// Next.js 16 multi-domain proxy (renamed from middleware.ts).
// Responsibilities (in order):
//   1. Rate limit unauthenticated sign-in / magic-link requests at the edge (RESEARCH.md
//      Architectural Responsibility Map: rate limiting Primary tier = Frontend Server).
//   2. Refresh Supabase session on every request (@supabase/ssr cookie management)
//   3. Always supabase.auth.getUser() — NEVER getSession() (CLAUDE.md hidden invariant)
//   4. Audience-domain enforcement: office JWT on track.* redirects to app.*; customer JWT on app.* redirects to track.*
//      Redirect targets read from env vars NEXT_PUBLIC_APP_HOST and NEXT_PUBLIC_PORTAL_HOST
//      (default to localhost in dev — NEVER hardcode prod literals).
//   5. NEVER set cookie domain attribute — let @supabase/ssr use host-scoped defaults (RESEARCH.md Pitfall 2)
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/shared/db/types'
import { signInLimiter, magicLinkPerIpLimiter } from '@/shared/rate-limit'

// Redirect targets read from env vars (defaults for local dev). Production sets these in Vercel.
const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST ?? 'http://app.localhost:3000'
const PORTAL_HOST = process.env.NEXT_PUBLIC_PORTAL_HOST ?? 'http://track.localhost:3000'

function clientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const isOffice = host.startsWith('app.')   // matches app.popsindustrial.com AND app.localhost:3000
  const isPortal = host.startsWith('track.')
  const url = new URL(request.url)
  const isSignInPost = request.method === 'POST' && url.pathname === '/sign-in'

  // 1. EDGE-LAYER RATE LIMIT (defense-in-depth; Server Action limiters in Plan 05 are secondary)
  if (isSignInPost) {
    const ip = clientIp(request)
    const limiter = isPortal ? magicLinkPerIpLimiter : signInLimiter
    const { success: rlOk } = await limiter.limit(`proxy:${ip}`)
    if (!rlOk) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again later.' },
        { status: 429 },
      )
    }
  }

  // 2. SESSION REFRESH
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- env vars validated at build; missing vars caught by Next.js config validation
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- env vars validated at build; missing vars caught by Next.js config validation
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. CRITICAL: always getUser() — never getSession() for auth decisions (CLAUDE.md)
  const { data: { user } } = await supabase.auth.getUser()

  // Tag Sentry with tenant_id when user is authenticated (DESIGN.md §4.5)
  if (user?.app_metadata?.tenant_id) {
    Sentry.setTag('tenant_id', String(user.app_metadata.tenant_id))
  }

  // 4. AUDIENCE-DOMAIN ENFORCEMENT (env-var-driven targets — never hardcoded)
  if (user) {
    const audience = user.app_metadata?.audience
    if (isPortal && audience !== 'customer') {
      // Office or shop JWT on track.* — redirect to office host (env-var-driven)
      return NextResponse.redirect(new URL(url.pathname + url.search, APP_HOST))
    }
    if (isOffice && audience === 'customer') {
      return NextResponse.redirect(new URL(url.pathname + url.search, PORTAL_HOST))
    }
    // staff_shop on app.* is allowed (workstations sign in via /scan/enroll on app.*)
  }

  return response
}

export const config = {
  matcher: [
    // Run on all routes except static assets and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
