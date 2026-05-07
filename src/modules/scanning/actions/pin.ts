'use server'
import { z } from 'zod'
import { createClient } from '@/shared/db/server'
import { requireShopStaff } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'

// Source: docs/DESIGN.md §4.3 Module 5 (Scanning) + migration 0015.
// Wraps app.validate_employee_pin SECURITY DEFINER function. The function
// returns a jsonb result; we narrow it to a discriminated union so callers
// can switch on result.ok without parsing strings.
//
// CLAUDE.md hard rule: service-role is FORBIDDEN in this module. The PIN
// function runs SECURITY DEFINER server-side, so the workstation JWT context
// is enough.

const ValidatePinSchema = z.object({
  employee_id: z.string().uuid(),
  pin: z.string().min(4).max(16),
})

export type ValidatePinInput = z.infer<typeof ValidatePinSchema>

export type ValidatePinResult =
  | { ok: true; employee_id: string }
  | { ok: false; reason: 'tenant_mismatch' }
  | { ok: false; reason: 'inactive' }
  | { ok: false; reason: 'locked'; until: string }
  | { ok: false; reason: 'invalid_pin'; attempts_remaining: number }

const RawPinResultSchema = z.union([
  z.object({ ok: z.literal(true), employee_id: z.string().uuid() }),
  z.object({ ok: z.literal(false), reason: z.literal('tenant_mismatch') }),
  z.object({ ok: z.literal(false), reason: z.literal('inactive') }),
  z.object({ ok: z.literal(false), reason: z.literal('locked'), until: z.string() }),
  z.object({
    ok: z.literal(false),
    reason: z.literal('invalid_pin'),
    attempts_remaining: z.number().int().nonnegative().default(0),
  }),
])

export async function validateEmployeePin(input: unknown): Promise<ValidatePinResult> {
  const parsed = ValidatePinSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  await requireShopStaff()
  const claims = await getCurrentClaims()
  const supabase = await createClient()

  const { data, error } = await supabase.schema('app').rpc('validate_employee_pin', {
    p_tenant_id: claims.tenant_id,
    p_employee_id: parsed.data.employee_id,
    p_pin: parsed.data.pin,
  })

  if (error) throw new Error(`PIN validation failed: ${error.message}`)
  if (!data) throw new Error('PIN validation returned no result')

  const narrowed = RawPinResultSchema.safeParse(data)
  if (!narrowed.success) {
    throw new Error(`PIN validation returned unrecognized result: ${JSON.stringify(data)}`)
  }

  return narrowed.data
}
