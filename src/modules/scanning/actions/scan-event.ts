'use server'
import { z } from 'zod'
import { createClient } from '@/shared/db/server'
import { requireShopStaff } from '@/shared/auth-helpers/require'
import type { Database } from '@/shared/db/types'

// Source: docs/DESIGN.md §4.3 Module 5 (Scanning) + migration 0016.
// Wraps app.record_scan_event SECURITY DEFINER. The DB function is THE ONLY
// writer of jobs.production_status (column-level REVOKE enforces this).
//
// Tenant comes from JWT inside the function — caller does NOT pass tenant_id.

const ProductionStageSchema = z.enum([
  'received',
  'prep',
  'coating',
  'curing',
  'qc',
  'completed',
  'picked_up',
])

const RecordScanEventSchema = z.object({
  job_id: z.string().uuid(),
  to_status: ProductionStageSchema,
  employee_id: z.string().uuid(),
  workstation_id: z.string().uuid(),
  notes: z.string().max(2000).optional(),
  attachment_id: z.string().uuid().optional(),
})

export type RecordScanEventInput = z.infer<typeof RecordScanEventSchema>

export interface RecordScanEventResult {
  event_id: string
  job_id: string
  to_status: string
}

export async function recordScanEvent(input: unknown): Promise<RecordScanEventResult> {
  const parsed = RecordScanEventSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  await requireShopStaff()
  const supabase = await createClient()

  const args: Database['app']['Functions']['record_scan_event']['Args'] = {
    p_job_id: parsed.data.job_id,
    p_to_status: parsed.data.to_status,
    p_employee_id: parsed.data.employee_id,
    p_workstation_id: parsed.data.workstation_id,
  }
  if (parsed.data.notes !== undefined) args.p_notes = parsed.data.notes
  if (parsed.data.attachment_id !== undefined) args.p_attachment_id = parsed.data.attachment_id

  const { data, error } = await supabase.schema('app').rpc('record_scan_event', args)

  if (error) {
    // SECURITY DEFINER raises:
    //   access_denied:* / job_not_found / employee_not_found / workstation_not_found / invalid_to_status
    throw new Error(`Scan event failed: ${error.message}`)
  }
  if (!data) throw new Error('Scan event failed: no event_id returned')

  return {
    event_id: data,
    job_id: parsed.data.job_id,
    to_status: parsed.data.to_status,
  }
}
