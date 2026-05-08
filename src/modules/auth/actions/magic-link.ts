'use server'
import { z } from 'zod'
import { headers } from 'next/headers'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/shared/db/server'
import { createServiceClient } from '@/shared/db/admin'
import { magicLinkPerEmailLimiter, magicLinkPerIpLimiter } from '@/shared/rate-limit'
import type { MagicLinkResult } from '../types'

const MagicLinkSchema = z.object({
  email: z.string().email().toLowerCase(),
})

const PORTAL_HOST = process.env.NEXT_PUBLIC_PORTAL_HOST ?? 'http://track.localhost:3000'

type HeaderReader = {
  get(name: string): string | null
}

export async function requestCustomerMagicLink(input: unknown): Promise<MagicLinkResult> {
  const parsed = MagicLinkSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input' }

  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const requestHost = getRequestHost(hdrs)

  // Rate limit BUT always return success-shape regardless (anti-enumeration per DESIGN.md §5.5)
  const [emailLimit, ipLimit] = await Promise.all([
    magicLinkPerEmailLimiter.limit(parsed.data.email).catch(() => undefined),
    magicLinkPerIpLimiter.limit(ip).catch(() => undefined),
  ])

  if (emailLimit?.success === false || ipLimit?.success === false) {
    return { success: true }
  }

  const customer = await findActiveCustomerUser(parsed.data.email, requestHost)
  if (!customer) {
    return { success: true }
  }

  const supabase = await createClient()
  // shouldCreateUser: false — customer must be pre-provisioned (DESIGN.md §5.5)
  await supabase.auth.signInWithOtp({
    email: customer.email,
    options: {
      emailRedirectTo: `${getPortalOrigin(hdrs, requestHost)}/auth/callback`,
      shouldCreateUser: false,
    },
  }).catch(() => undefined) // swallow errors for anti-enumeration

  // Always success-shape, regardless of whether email exists or rate limit hit
  return { success: true }
}

async function findActiveCustomerUser(
  email: string,
  requestHost: string | null
): Promise<{ id: string; tenant_id: string; email: string } | null> {
  Sentry.setTag('tenant_id', 'unknown')

  if (!requestHost) {
    Sentry.addBreadcrumb({
      category: 'auth.magic_link',
      message: 'Skipped customer magic-link lookup without request host',
      level: 'info',
    })
    return null
  }

  // Service-role is required here because magic-link requests are unauthenticated
  // and customer_users intentionally has no anon/customer self-select policy. The
  // read is bounded to the customer tenant_domains host before checking the email.
  const supabaseAdmin = createServiceClient()

  const { data: domain, error: domainError } = await supabaseAdmin
    .from('tenant_domains')
    .select('tenant_id')
    .eq('host', requestHost)
    .eq('audience', 'customer')
    .maybeSingle()

  if (domainError || !domain) {
    if (domainError) {
      Sentry.captureException(domainError, {
        tags: { tenant_id: 'unknown', subsystem: 'portal-magic-link' },
      })
    }
    return null
  }

  Sentry.setTag('tenant_id', domain.tenant_id)

  const { data: customer, error: customerError } = await supabaseAdmin
    .from('customer_users')
    .select('id, tenant_id, email')
    .eq('tenant_id', domain.tenant_id)
    .eq('email', email)
    .eq('is_active', true)
    .maybeSingle()

  if (customerError || !customer) {
    if (customerError) {
      Sentry.captureException(customerError, {
        tags: { tenant_id: domain.tenant_id, subsystem: 'portal-magic-link' },
      })
    }
    Sentry.addBreadcrumb({
      category: 'auth.magic_link',
      message: 'Customer magic-link request did not match an active portal user',
      level: 'info',
      data: { tenant_id: domain.tenant_id },
    })
    return null
  }

  Sentry.addBreadcrumb({
    category: 'auth.magic_link',
    message: 'Customer magic-link request matched an active portal user',
    level: 'info',
    data: { tenant_id: customer.tenant_id, customer_user_id: customer.id },
  })

  return customer
}

function getRequestHost(hdrs: HeaderReader): string | null {
  return normalizeHeaderHost(hdrs.get('x-forwarded-host')) ?? normalizeHeaderHost(hdrs.get('host'))
}

function getPortalOrigin(hdrs: HeaderReader, requestHost: string | null): string {
  if (!requestHost) return PORTAL_HOST

  const forwardedProto = firstHeaderValue(hdrs.get('x-forwarded-proto'))?.toLowerCase()
  const protocol =
    forwardedProto === 'http' || forwardedProto === 'https'
      ? forwardedProto
      : requestHost.includes('localhost')
        ? 'http'
        : 'https'

  return `${protocol}://${requestHost}`
}

function normalizeHeaderHost(value: string | null): string | null {
  const host = firstHeaderValue(value)?.toLowerCase()
  if (!host) return null

  try {
    return host.includes('://') ? new URL(host).host.toLowerCase() : host
  } catch {
    return host
  }
}

function firstHeaderValue(value: string | null): string | null {
  const first = value?.split(',')[0]?.trim()
  return first && first.length > 0 ? first : null
}
