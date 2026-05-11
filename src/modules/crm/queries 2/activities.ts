import 'server-only'
import { z } from 'zod'
import { createClient } from '@/shared/db/server'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'

const ListActivitiesParamsSchema = z.object({
  entity_type: z.enum(['company', 'contact', 'job']),
  entity_id: z.string().uuid(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
})

export type ListActivitiesParams = z.infer<typeof ListActivitiesParamsSchema>

export interface ActivityListItem {
  id: string
  entity_type: string
  entity_id: string
  activity_type: string
  subject: string
  body: string | null
  customer_visible: boolean
  staff_id: string | null
  occurred_at: string
}

export async function listActivities(params: unknown): Promise<ActivityListItem[]> {
  const parsed = ListActivitiesParamsSchema.parse(params)
  await requireOfficeStaff()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('activities')
    .select('id, entity_type, entity_id, activity_type, subject, body, customer_visible, staff_id, occurred_at')
    .eq('entity_type', parsed.entity_type)
    .eq('entity_id', parsed.entity_id)
    .order('occurred_at', { ascending: false })
    .range(parsed.offset, parsed.offset + parsed.limit - 1)

  if (error) throw new Error(`Activity list failed: ${error.message}`)
  return data ?? []
}
