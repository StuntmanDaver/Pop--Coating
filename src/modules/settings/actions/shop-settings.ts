'use server'
import { z } from 'zod'
import { createClient } from '@/shared/db/server'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'
import { logAuditEvent } from '@/shared/audit'
import type { Database } from '@/shared/db/types'

// Source: docs/DESIGN.md §3.3 shop_settings + supabase/migrations/0002.
//
// Lock invariant (DESIGN.md): once is_first_job_created = true, timezone, currency,
// and job_number_prefix may NOT be changed (they're embedded in already-printed
// job numbers / packets). Enforced app-side here as a courtesy; ultimate enforcement
// would be a CHECK trigger but Wave 1 keeps it in app code per the schema comment.

type ShopSettingsUpdate = Database['public']['Tables']['shop_settings']['Update']

const HexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/)

const UpdateShopSettingsSchema = z.object({
  timezone: z.string().min(1).max(64).optional(),
  currency: z.string().length(3).optional(),
  job_number_prefix: z.string().min(1).max(20).optional(),
  business_hours: z.record(z.string(), z.unknown()).optional(),
  brand_color_hex: HexColor.nullish(),
  default_due_days: z.number().int().min(1).max(365).optional(),
  tablet_inactivity_hours: z.number().int().min(1).max(24).optional(),
  pin_mode: z.enum(['per_shift', 'per_scan']).optional(),
})

export type UpdateShopSettingsInput = z.infer<typeof UpdateShopSettingsSchema>

const LOCKED_ONCE_JOBS_EXIST = ['timezone', 'currency', 'job_number_prefix'] as const

export async function updateShopSettings(input: unknown): Promise<{ tenant_id: string }> {
  const parsed = UpdateShopSettingsSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  await requireOfficeStaff()
  const claims = await getCurrentClaims()
  const supabase = await createClient()

  // Read current is_first_job_created to enforce the lock.
  const { data: current, error: readError } = await supabase
    .from('shop_settings')
    .select('is_first_job_created')
    .eq('tenant_id', claims.tenant_id)
    .single()

  if (readError || !current) {
    throw new Error(`Shop settings read failed: ${readError?.message ?? 'not found'}`)
  }

  const wantsLockedFieldChange = LOCKED_ONCE_JOBS_EXIST.some(
    (k) => parsed.data[k as keyof typeof parsed.data] !== undefined
  )
  if (current.is_first_job_created && wantsLockedFieldChange) {
    throw new Error(
      `Cannot change timezone/currency/job_number_prefix after the first job has been created`
    )
  }

  const updateRow = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v !== undefined)
  ) as ShopSettingsUpdate

  const { error } = await supabase
    .from('shop_settings')
    .update(updateRow)
    .eq('tenant_id', claims.tenant_id)

  if (error) throw new Error(`Shop settings update failed: ${error.message}`)

  await logAuditEvent({
    action: 'update',
    entity_type: 'shop_settings',
    entity_id: claims.tenant_id,
    changed_fields: updateRow as Record<string, unknown>,
  })
  return { tenant_id: claims.tenant_id }
}
