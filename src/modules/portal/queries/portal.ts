import 'server-only'
import { z } from 'zod'
import { createClient } from '@/shared/db/server'
import { requireCustomer } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'

// Source: docs/DESIGN.md §4.3 Module 9 (Portal). Customer-facing read surface.
// All queries are bounded by RLS to the customer's company_id; we add app-side
// filters as defense-in-depth (filter on customer_visible where applicable).

const ListMyJobsParamsSchema = z.object({
  intake_status: z
    .enum(['draft', 'scheduled', 'in_production', 'archived'])
    .optional(),
  limit: z.number().int().min(1).max(100).default(25),
  offset: z.number().int().min(0).default(0),
})

export type ListMyJobsParams = z.infer<typeof ListMyJobsParamsSchema>

export interface PortalJobListItem {
  id: string
  job_number: string
  job_name: string
  intake_status: string
  production_status: string | null
  on_hold: boolean
  due_date: string | null
  created_at: string
}

export async function listMyJobs(params: unknown = {}): Promise<PortalJobListItem[]> {
  const parsed = ListMyJobsParamsSchema.parse(params)
  await requireCustomer()
  const claims = await getCurrentClaims()

  if (!claims.company_id) {
    throw new Error('Portal access requires company_id in JWT')
  }

  const supabase = await createClient()

  let query = supabase
    .from('jobs')
    .select('id, job_number, job_name, intake_status, production_status, on_hold, due_date, created_at')
    .eq('company_id', claims.company_id)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .range(parsed.offset, parsed.offset + parsed.limit - 1)

  if (parsed.intake_status) query = query.eq('intake_status', parsed.intake_status)

  const { data, error } = await query
  if (error) throw new Error(`Portal job list failed: ${error.message}`)
  return data ?? []
}

const GetMyJobSchema = z.object({ id: z.string().uuid() })

export interface PortalJobDetail {
  id: string
  job_number: string
  job_name: string
  description: string | null
  customer_po_number: string | null
  intake_status: string
  production_status: string | null
  on_hold: boolean
  hold_reason: string | null
  due_date: string | null
  color: string | null
  created_at: string
}

export async function getMyJob(input: unknown): Promise<PortalJobDetail | null> {
  const parsed = GetMyJobSchema.parse(input)
  await requireCustomer()
  const claims = await getCurrentClaims()

  if (!claims.company_id) {
    throw new Error('Portal access requires company_id in JWT')
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('jobs')
    .select(
      'id, job_number, job_name, description, customer_po_number, intake_status, production_status, on_hold, hold_reason, due_date, color, created_at'
    )
    .eq('id', parsed.id)
    .eq('company_id', claims.company_id)
    .is('archived_at', null)
    .maybeSingle()

  if (error) throw new Error(`Portal job fetch failed: ${error.message}`)
  return data
}
