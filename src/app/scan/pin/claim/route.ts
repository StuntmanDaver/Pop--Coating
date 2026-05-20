import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/shared/db/server'

type RpcError = { message: string }

type AppSchemaRpc = {
  rpc: <TResult, TArgs = void>(
    fn: string,
    args?: TArgs
  ) => Promise<{ data: TResult | null; error: RpcError | null }>
}

function appSchema(supabase: unknown): AppSchemaRpc {
  return (supabase as { schema: (name: string) => AppSchemaRpc }).schema('app')
}

const UuidLikeSchema = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
)

const ClaimPinSchema = z.object({
  employee_id: UuidLikeSchema,
  workstation_id: UuidLikeSchema,
  expected_version: z.number().int().nonnegative(),
  pin: z.string().min(4).max(16),
})

type PinResult =
  | { ok: true; employee_id: string }
  | { ok: false; reason?: string; attempts_remaining?: number; until?: string }

type ClaimResult = {
  ok: boolean
  new_version?: number
  version?: number
  reason?: string
}

type WorkstationClaimRow = {
  current_employee_id: string | null
  version: number
}

export async function POST(request: NextRequest) {
  const parsed = ClaimPinSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, step: 'input', reason: 'invalid_input' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user || user.app_metadata?.audience !== 'staff_shop') {
    return NextResponse.json({ ok: false, step: 'auth', reason: 'tenant_mismatch' }, { status: 401 })
  }

  const { data: pinResult, error: pinError } = await appSchema(supabase).rpc<
    PinResult,
    { p_employee_id: string; p_pin: string }
  >('validate_employee_pin', {
    p_employee_id: parsed.data.employee_id,
    p_pin: parsed.data.pin,
  })

  if (pinError || !pinResult) {
    return NextResponse.json({ ok: false, step: 'pin', reason: 'rpc_error' }, { status: 500 })
  }
  if (!pinResult.ok) {
    const { ok: _ok, ...pinFailure } = pinResult
    return NextResponse.json({ ok: false, step: 'pin', ...pinFailure })
  }

  const { data: claimResult, error: claimError } = await appSchema(supabase).rpc<
    ClaimResult,
    { p_workstation_id: string; p_employee_id: string; p_expected_version: number }
  >('claim_workstation', {
    p_workstation_id: parsed.data.workstation_id,
    p_employee_id: parsed.data.employee_id,
    p_expected_version: parsed.data.expected_version,
  })

  if (claimError || !claimResult) {
    return NextResponse.json({ ok: false, step: 'claim', reason: 'rpc_error' }, { status: 500 })
  }

  if (!claimResult.ok && claimResult.reason === 'workstation_in_use_or_stale_version') {
    const { data: workstation } = await supabase
      .from('workstations')
      .select('current_employee_id, version')
      .eq('id', parsed.data.workstation_id)
      .maybeSingle<WorkstationClaimRow>()

    if (workstation?.current_employee_id === parsed.data.employee_id) {
      return NextResponse.json({
        ok: true,
        step: 'claim',
        version: workstation.version,
        idempotent: true,
      })
    }
  }

  return NextResponse.json({ step: 'claim', ...claimResult })
}
