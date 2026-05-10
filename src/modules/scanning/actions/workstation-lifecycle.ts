'use server'
import { z } from 'zod'
import { createClient } from '@/shared/db/server'
import { requireShopStaff } from '@/shared/auth-helpers/require'

// Source: docs/DESIGN.md §4.3 Module 5 (Scanning) + supabase/migrations/0009.
// CLAUDE.md hard rule: service-role is FORBIDDEN in this module. All RPCs run in
// the workstation's own JWT context — the SECURITY DEFINER functions enforce
// audience='staff_shop' + workstation_id match server-side.
//
// Wave-1 scope here: workstation lifecycle only (claim/heartbeat/release).
// app.record_scan_event() and app.validate_employee_pin() ship in Phase 3 with their
// migration; their wrappers will land alongside those migrations.

// app schema is exposed in supabase/config.toml; SECURITY DEFINER functions enforce
// audience/tenant/identity gates server-side. We route via .schema('app') because
// supabase.rpc() defaults to public and these functions live in the `app` namespace.
type AppSchemaRpc = {
  rpc: <TResult, TArgs = void>(
    fn: string,
    args?: TArgs
  ) => Promise<{ data: TResult | null; error: { message: string } | null }>
}

function appSchema(supabase: unknown): AppSchemaRpc {
  return (supabase as { schema: (name: string) => AppSchemaRpc }).schema('app')
}

const ClaimWorkstationSchema = z.object({
  workstation_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  expected_version: z.number().int().nonnegative(),
})

export type ClaimWorkstationInput = z.infer<typeof ClaimWorkstationSchema>

interface ClaimResult {
  ok: boolean
  new_version?: number
  reason?: string
}

export async function claimWorkstation(input: unknown): Promise<ClaimResult> {
  const parsed = ClaimWorkstationSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  await requireShopStaff()
  const supabase = await createClient()

  const { data, error } = await appSchema(supabase).rpc<
    ClaimResult,
    { p_workstation_id: string; p_employee_id: string; p_expected_version: number }
  >('claim_workstation', {
    p_workstation_id: parsed.data.workstation_id,
    p_employee_id: parsed.data.employee_id,
    p_expected_version: parsed.data.expected_version,
  })

  if (error) {
    // SECURITY DEFINER raises 'access_denied: ...' for tenant/audience/identity gates.
    throw new Error(`Workstation claim failed: ${error.message}`)
  }
  if (!data) throw new Error('Workstation claim failed: no result')
  return data
}

export async function recordWorkstationHeartbeat(): Promise<{ ok: true }> {
  await requireShopStaff()
  const supabase = await createClient()

  const { error } = await appSchema(supabase).rpc<null>('record_workstation_heartbeat')
  if (error) throw new Error(`Heartbeat failed: ${error.message}`)
  return { ok: true }
}

export async function releaseWorkstation(): Promise<{ ok: true }> {
  await requireShopStaff()
  const supabase = await createClient()

  const { error } = await appSchema(supabase).rpc<null>('release_workstation')
  if (error) throw new Error(`Workstation release failed: ${error.message}`)
  return { ok: true }
}
