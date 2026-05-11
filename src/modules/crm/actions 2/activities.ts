'use server'
import { z } from 'zod'
import { createClient } from '@/shared/db/server'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'
import { logAuditEvent } from '@/shared/audit'

// Source: docs/DESIGN.md §3.3 activities table.
// Polymorphic on (entity_type, entity_id). Wave-1 entity types: company | contact | job.
// staff_id is sourced from the JWT claim (set by Auth Hook); not user-provided.

const ActivityTypeSchema = z.enum(['call', 'email', 'meeting', 'note', 'sms'])
const EntityTypeSchema = z.enum(['company', 'contact', 'job'])

const LogActivitySchema = z.object({
  entity_type: EntityTypeSchema,
  entity_id: z.string().uuid(),
  activity_type: ActivityTypeSchema,
  subject: z.string().min(1).max(500),
  body: z.string().max(20000).nullish(),
  customer_visible: z.boolean().default(false),
  occurred_at: z.string().datetime().optional(),
})

export type LogActivityInput = z.infer<typeof LogActivitySchema>

interface ActivityRow {
  id: string
  tenant_id: string
  entity_type: string
  entity_id: string
}

export async function logActivity(input: unknown): Promise<ActivityRow> {
  const parsed = LogActivitySchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  await requireOfficeStaff()
  const claims = await getCurrentClaims()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('activities')
    .insert({
      tenant_id: claims.tenant_id,
      entity_type: parsed.data.entity_type,
      entity_id: parsed.data.entity_id,
      activity_type: parsed.data.activity_type,
      subject: parsed.data.subject,
      body: parsed.data.body ?? null,
      customer_visible: parsed.data.customer_visible,
      staff_id: claims.staff_id ?? null,
      occurred_at: parsed.data.occurred_at ?? new Date().toISOString(),
    })
    .select('id, tenant_id, entity_type, entity_id')
    .single()

  if (error || !data) throw new Error(`Activity insert failed: ${error?.message ?? 'unknown'}`)

  await logAuditEvent({ action: 'create', entity_type: 'activity', entity_id: data.id })
  return data
}
