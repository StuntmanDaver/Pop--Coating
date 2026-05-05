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

type AppSchemaRpc = {
  rpc: <TResult, TArgs = void>(
    fn: string,
    args?: TArgs
  ) => Promise<{ data: TResult | null; error: { message: string } | null }>
}

function appSchema(supabase: unknown): AppSchemaRpc {
  return (supabase as { schema: (name: string) => AppSchemaRpc }).schema('app')
}

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

interface RawPinResult {
  ok: boolean
  reason?: string
  employee_id?: string
  until?: string
  attempts_remaining?: number
}

export async function validateEmployeePin(input: unknown): Promise<ValidatePinResult> {
  const parsed = ValidatePinSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  await requireShopStaff()
  const claims = await getCurrentClaims()
  const supabase = await createClient()

  const { data, error } = await appSchema(supabase).rpc<
    RawPinResult,
    { p_tenant_id: string; p_employee_id: string; p_pin: string }
  >('validate_employee_pin', {
    p_tenant_id: claims.tenant_id,
    p_employee_id: parsed.data.employee_id,
    p_pin: parsed.data.pin,
  })

  if (error) throw new Error(`PIN validation failed: ${error.message}`)
  if (!data) throw new Error('PIN validation returned no result')

  if (data.ok && data.employee_id) {
    return { ok: true, employee_id: data.employee_id }
  }
  if (!data.ok) {
    switch (data.reason) {
      case 'tenant_mismatch':
        return { ok: false, reason: 'tenant_mismatch' }
      case 'inactive':
        return { ok: false, reason: 'inactive' }
      case 'locked':
        if (!data.until) throw new Error('PIN locked result missing until timestamp')
        return { ok: false, reason: 'locked', until: data.until }
      case 'invalid_pin':
        return {
          ok: false,
          reason: 'invalid_pin',
          attempts_remaining: data.attempts_remaining ?? 0,
        }
    }
  }
  throw new Error(`PIN validation returned unrecognized result: ${JSON.stringify(data)}`)
}
