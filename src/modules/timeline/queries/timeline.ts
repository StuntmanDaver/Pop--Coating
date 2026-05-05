import 'server-only'
import { z } from 'zod'
import { createClient } from '@/shared/db/server'
import { requireOfficeStaff, requireCustomer } from '@/shared/auth-helpers/require'

// Source: docs/DESIGN.md §3.3 job_status_history + §4.3 Module 6 (Timeline).
// RLS already filters by tenant + (for customers) by company_id and customer_visible=true.
// We add the customer_visible filter app-side too as defense-in-depth for the portal path.

const GetJobTimelineSchema = z.object({
  job_id: z.string().uuid(),
  limit: z.number().int().min(1).max(500).default(100),
  offset: z.number().int().min(0).default(0),
})

export type GetJobTimelineParams = z.infer<typeof GetJobTimelineSchema>

export interface TimelineEvent {
  id: string
  event_type: string
  from_status: string | null
  to_status: string | null
  is_rework: boolean
  is_unusual_transition: boolean
  shop_employee_id: string | null
  workstation_id: string | null
  attachment_id: string | null
  customer_visible: boolean
  notes: string | null
  scanned_at: string
  duration_seconds: number | null
}

const TIMELINE_COLUMNS =
  'id, event_type, from_status, to_status, is_rework, is_unusual_transition, shop_employee_id, workstation_id, attachment_id, customer_visible, notes, scanned_at, duration_seconds'

export async function getJobTimeline(params: unknown): Promise<TimelineEvent[]> {
  const parsed = GetJobTimelineSchema.parse(params)
  await requireOfficeStaff()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('job_status_history')
    .select(TIMELINE_COLUMNS)
    .eq('job_id', parsed.job_id)
    .order('scanned_at', { ascending: false })
    .range(parsed.offset, parsed.offset + parsed.limit - 1)

  if (error) throw new Error(`Timeline fetch failed: ${error.message}`)
  return (data ?? []) as TimelineEvent[]
}

export async function getCustomerVisibleTimeline(params: unknown): Promise<TimelineEvent[]> {
  const parsed = GetJobTimelineSchema.parse(params)
  await requireCustomer()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('job_status_history')
    .select(TIMELINE_COLUMNS)
    .eq('job_id', parsed.job_id)
    .eq('customer_visible', true)
    .order('scanned_at', { ascending: false })
    .range(parsed.offset, parsed.offset + parsed.limit - 1)

  if (error) throw new Error(`Customer timeline fetch failed: ${error.message}`)
  return (data ?? []) as TimelineEvent[]
}

const GetEmployeeScanHistorySchema = z.object({
  shop_employee_id: z.string().uuid(),
  since: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(500).default(100),
})

export type GetEmployeeScanHistoryParams = z.infer<typeof GetEmployeeScanHistorySchema>

export async function getEmployeeScanHistory(params: unknown): Promise<TimelineEvent[]> {
  const parsed = GetEmployeeScanHistorySchema.parse(params)
  await requireOfficeStaff()
  const supabase = await createClient()

  let query = supabase
    .from('job_status_history')
    .select(TIMELINE_COLUMNS)
    .eq('shop_employee_id', parsed.shop_employee_id)
    .order('scanned_at', { ascending: false })
    .limit(parsed.limit)

  if (parsed.since) query = query.gte('scanned_at', parsed.since)

  const { data, error } = await query
  if (error) throw new Error(`Employee scan history fetch failed: ${error.message}`)
  return (data ?? []) as TimelineEvent[]
}
