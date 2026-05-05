import 'server-only'
import { z } from 'zod'
import { createClient } from '@/shared/db/server'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'
import { escapeForOr } from '@/shared/db/postgrest'

const ListJobsParamsSchema = z.object({
  q: z.string().max(200).optional(),
  company_id: z.string().uuid().optional(),
  intake_status: z.enum(['draft', 'scheduled', 'in_production', 'archived']).optional(),
  production_status: z
    .enum(['received', 'prep', 'coating', 'curing', 'qc', 'completed', 'picked_up'])
    .optional(),
  on_hold: z.boolean().optional(),
  include_archived: z.boolean().default(false),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
})

export type ListJobsParams = z.infer<typeof ListJobsParamsSchema>

export interface JobListItem {
  id: string
  job_number: string
  job_name: string
  company_id: string
  intake_status: string
  production_status: string | null
  on_hold: boolean
  due_date: string | null
  priority: string
  created_at: string
}

export async function listJobs(params: unknown = {}): Promise<JobListItem[]> {
  const parsed = ListJobsParamsSchema.parse(params)
  await requireOfficeStaff()
  const supabase = await createClient()

  let query = supabase
    .from('jobs')
    .select(
      'id, job_number, job_name, company_id, intake_status, production_status, on_hold, due_date, priority, created_at'
    )
    .order('created_at', { ascending: false })
    .range(parsed.offset, parsed.offset + parsed.limit - 1)

  if (!parsed.include_archived) query = query.is('archived_at', null)
  if (parsed.company_id) query = query.eq('company_id', parsed.company_id)
  if (parsed.intake_status) query = query.eq('intake_status', parsed.intake_status)
  if (parsed.production_status) query = query.eq('production_status', parsed.production_status)
  if (parsed.on_hold !== undefined) query = query.eq('on_hold', parsed.on_hold)
  if (parsed.q) {
    const q = escapeForOr(parsed.q)
    query = query.or(`job_number.ilike.%${q}%,job_name.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(`Job list failed: ${error.message}`)
  return data ?? []
}

const GetJobByIdSchema = z.object({ id: z.string().uuid() })

export async function getJobById(input: unknown) {
  const parsed = GetJobByIdSchema.parse(input)
  await requireOfficeStaff()
  const supabase = await createClient()

  const { data, error } = await supabase.from('jobs').select('*').eq('id', parsed.id).maybeSingle()
  if (error) throw new Error(`Job fetch failed: ${error.message}`)
  return data
}

const GetJobByPacketTokenSchema = z.object({ packet_token: z.string().min(16).max(16) })

export async function getJobByPacketToken(input: unknown) {
  const parsed = GetJobByPacketTokenSchema.parse(input)
  // No requireOfficeStaff guard here — the scanning module calls this in workstation
  // auth context (staff_shop). Tenant + audience filtering is handled by RLS on jobs.
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('jobs')
    .select('id, tenant_id, job_number, job_name, company_id, intake_status, production_status, on_hold')
    .eq('packet_token', parsed.packet_token)
    .maybeSingle()

  if (error) throw new Error(`Job lookup-by-token failed: ${error.message}`)
  return data
}
