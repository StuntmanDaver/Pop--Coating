import 'server-only'
import { z } from 'zod'
import { createClient } from '@/shared/db/server'
import { requireShopStaff } from '@/shared/auth-helpers/require'
import type { LookupJobByPacketTokenInput, ScannedJob } from '../types'

// Source: docs/DESIGN.md §4.3 Module 5 — lookupJobByPacketToken supports
// last-8-char prefix matching for the manual-entry fallback (when the QR is
// damaged or hard to scan). Tenant scoping comes from RLS on jobs.
//
// Token shape: 16-char URL-safe random per migration 0005. Manual entry uses
// the LAST 8 chars (printed prominently below the QR per packets module).

const LookupSchema = z.object({
  token_or_prefix: z.string().min(8).max(16),
})

export async function lookupJobByPacketToken(input: unknown): Promise<ScannedJob | null> {
  const parsed = LookupSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  await requireShopStaff()
  const supabase = await createClient()

  const value = parsed.data.token_or_prefix.trim()
  const isFullToken = value.length === 16

  let query = supabase
    .from('jobs')
    .select('id, job_number, job_name, intake_status, production_status, on_hold, packet_token')

  if (isFullToken) {
    query = query.eq('packet_token', value)
  } else {
    // Manual entry: last-N-char suffix match. Use ilike with a leading wildcard.
    // Supabase JS escapes the value; %_ inside `value` would NOT be filter-injection
    // because .ilike takes the pattern as a structured arg, not a free-form .or().
    // Performance note: this isn't index-backable; fine at Wave-1 volumes (~hundreds
    // of active jobs per tenant). Wave-3 may add a generated column + index if the
    // active job count grows beyond a few thousand per tenant.
    query = query.ilike('packet_token', `%${value}`)
  }

  const { data, error } = await query.limit(2)

  if (error) throw new Error(`Packet lookup failed: ${error.message}`)
  if (!data || data.length === 0) return null
  if (data.length > 1) {
    // Suffix collision — return null and let the caller prompt for a fuller token.
    // 8 chars of base64url is 48 bits, so collisions inside one tenant are essentially
    // impossible at Wave-1 volumes, but we don't want to silently pick one.
    throw new Error('Ambiguous packet token — provide more characters')
  }
  return data[0] ?? null
}
