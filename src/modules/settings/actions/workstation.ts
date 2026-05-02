'use server'
import { z } from 'zod'
import crypto from 'node:crypto'
import { createClient } from '@/shared/db/server'
import { createServiceClient } from '@/shared/db/admin' // service-role allowed in settings per CLAUDE.md
import { requireOfficeStaff } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'

const CreateWorkstationSchema = z.object({
  name: z.string().min(1).max(100),
  default_stage: z.string().optional(),
  location: z.string().optional(),
})

// Typed shape of a workstations row (mirrors supabase/migrations/0003_auth_tables.sql).
// Replaced by generated types from `supabase gen types typescript --local` in Plan 06.
type WorkstationRow = {
  id: string
  tenant_id: string
  name: string
  default_stage: string | null
  physical_location: string | null
  device_token: string
  auth_user_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

function generateDeviceToken(): string {
  // 48-char URL-safe random per DESIGN.md §3.3 workstations.device_token
  return crypto.randomBytes(48).toString('base64url').slice(0, 48)
}

export async function createWorkstation(input: unknown) {
  const parsed = CreateWorkstationSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  await requireOfficeStaff()
  const claims = await getCurrentClaims()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- placeholder DB types (Plan 06 generates real types); any required until `supabase gen types` runs
  const supabase = (await createClient()) as any
  const supabaseAdmin = createServiceClient()

  const device_token = generateDeviceToken()

  // Step 1: Insert workstations row FIRST (to get UUID for app_metadata)
  const { data: ws, error: wsError } = await (supabase
    .from('workstations')
    .insert({
      tenant_id: claims.tenant_id,
      name: parsed.data.name,
      default_stage: parsed.data.default_stage ?? null,
      physical_location: parsed.data.location ?? null,
      device_token,
    })
    .select()
    .single() as Promise<{ data: WorkstationRow | null; error: { message: string } | null }>)

  if (wsError || !ws) throw new Error(`Workstation insert failed: ${wsError?.message ?? 'unknown'}`)

  // Step 2: Create synthetic auth user with workstation_id in app_metadata FROM CREATION
  // Synthetic email format: workstation-{uuid}@workstations.pops.local (DESIGN.md §1658)
  const synthetic_email = `workstation-${crypto.randomUUID()}@workstations.pops.local`
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: synthetic_email,
    password: device_token,
    email_confirm: true,
    app_metadata: {
      tenant_id: claims.tenant_id,
      audience: 'staff_shop',
      workstation_id: ws.id,
      role: 'shop',
    },
  })

  if (authError || !authData?.user) throw new Error(`Auth user creation failed: ${authError?.message ?? 'unknown'}`)

  // Step 3: Link auth_user_id back to workstations row
  const { error: linkError } = await (supabase
    .from('workstations')
    .update({ auth_user_id: authData.user.id })
    .eq('id', ws.id) as Promise<{ error: { message: string } | null }>)

  if (linkError) throw new Error(`Workstation link failed: ${linkError.message}`)

  const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST ?? 'http://app.localhost:3000'
  return {
    workstation: ws,
    enrollment_url: `${APP_HOST}/scan/enroll?token=${device_token}`,
  }
}
