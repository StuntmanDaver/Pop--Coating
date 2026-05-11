import 'server-only'
import { createClient } from '@/shared/db/server'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'

// Source: docs/DESIGN.md §4.3 Module 7 (Dashboard).
// All counts are tenant-scoped via RLS — no explicit tenant_id filter needed.

export interface DashboardCounts {
  jobs_in_production: number
  jobs_on_hold: number
  jobs_overdue: number
  jobs_due_this_week: number
}

export async function getDashboardCounts(): Promise<DashboardCounts> {
  await requireOfficeStaff()
  const supabase = await createClient()

  const today = new Date().toISOString().slice(0, 10)
  const oneWeek = new Date()
  oneWeek.setDate(oneWeek.getDate() + 7)
  const inOneWeek = oneWeek.toISOString().slice(0, 10)

  const [inProduction, onHold, overdue, dueThisWeek] = await Promise.all([
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('intake_status', 'in_production')
      .is('archived_at', null),
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('on_hold', true)
      .is('archived_at', null),
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .lt('due_date', today)
      .neq('intake_status', 'archived')
      .is('archived_at', null),
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .gte('due_date', today)
      .lte('due_date', inOneWeek)
      .neq('intake_status', 'archived')
      .is('archived_at', null),
  ])

  for (const result of [inProduction, onHold, overdue, dueThisWeek]) {
    if (result.error) throw new Error(`Dashboard counts failed: ${result.error.message}`)
  }

  return {
    jobs_in_production: inProduction.count ?? 0,
    jobs_on_hold: onHold.count ?? 0,
    jobs_overdue: overdue.count ?? 0,
    jobs_due_this_week: dueThisWeek.count ?? 0,
  }
}

export interface RecentJob {
  id: string
  job_number: string
  job_name: string
  intake_status: string
  production_status: string | null
  on_hold: boolean
  due_date: string | null
  priority: string
  created_at: string
}

export async function getRecentJobs(limit = 10): Promise<RecentJob[]> {
  await requireOfficeStaff()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('jobs')
    .select('id, job_number, job_name, intake_status, production_status, on_hold, due_date, priority, created_at')
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Recent jobs failed: ${error.message}`)
  return data ?? []
}

export interface ActiveWorkstation {
  id: string
  name: string
  default_stage: string | null
  last_activity_at: string | null
  current_employee_id: string | null
}

export async function getActiveWorkstations(): Promise<ActiveWorkstation[]> {
  await requireOfficeStaff()
  const supabase = await createClient()

  // "Active" = activity within the last 5 minutes (heartbeat updates last_activity_at).
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('workstations')
    .select('id, name, default_stage, last_activity_at, current_employee_id')
    .gte('last_activity_at', fiveMinAgo)
    .eq('is_active', true)
    .order('last_activity_at', { ascending: false })

  if (error) throw new Error(`Active workstations failed: ${error.message}`)
  return data ?? []
}
