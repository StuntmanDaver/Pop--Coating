'use server'
import { z } from 'zod'
import { headers } from 'next/headers'
import { createClient } from '@/shared/db/server'
import { magicLinkPerEmailLimiter, magicLinkPerIpLimiter } from '@/shared/rate-limit'
import type { MagicLinkResult } from '../types'

const MagicLinkSchema = z.object({
  email: z.string().email().toLowerCase(),
})

const PORTAL_HOST = process.env.NEXT_PUBLIC_PORTAL_HOST ?? 'http://track.localhost:3000'

export async function requestCustomerMagicLink(input: unknown): Promise<MagicLinkResult> {
  const parsed = MagicLinkSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input' }

  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  // Rate limit BUT always return success-shape regardless (anti-enumeration per DESIGN.md §5.5)
  await magicLinkPerEmailLimiter.limit(parsed.data.email).catch(() => undefined)
  await magicLinkPerIpLimiter.limit(ip).catch(() => undefined)

  const supabase = await createClient()
  // shouldCreateUser: false — customer must be pre-provisioned (DESIGN.md §5.5)
  await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${PORTAL_HOST}/auth/callback`,
      shouldCreateUser: false,
    },
  }).catch(() => undefined) // swallow errors for anti-enumeration

  // Always success-shape, regardless of whether email exists or rate limit hit
  return { success: true }
}
