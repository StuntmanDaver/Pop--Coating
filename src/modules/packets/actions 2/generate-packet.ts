'use server'
import { z } from 'zod'
import { createClient } from '@/shared/db/server'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'
import { regenerateQrPngDataUrl } from '../queries/qr'
import { logAuditEvent } from '@/shared/audit'

// Source: docs/DESIGN.md §4.3 Module 4 (Packets).
//   - generatePacketPdf(job_id) renders a printable packet PDF.
//   - On success, sets jobs.packet_dirty = false (regen completed).
//   - Lazy-loads @react-pdf/renderer + the document component to keep cold-start fast.
//
// RLS handles tenant isolation on the job + tenant + company joins. We only call
// from office-staff context.

const GeneratePacketPdfSchema = z.object({
  job_id: z.string().uuid(),
})

export type GeneratePacketPdfInput = z.infer<typeof GeneratePacketPdfSchema>

export interface GeneratePacketPdfResult {
  pdf: Buffer
  job_number: string
  packet_token: string
}

interface JobJoinRow {
  id: string
  job_number: string
  job_name: string
  description: string | null
  customer_po_number: string | null
  color: string | null
  coating_type: string | null
  part_count: number | null
  weight_lbs: number | string | null
  dimensions_text: string | null
  due_date: string | null
  priority: string
  packet_token: string
  companies: { name: string } | null
  contacts: { first_name: string; last_name: string | null } | null
  tenants: { name: string } | null
}

export async function generatePacketPdf(input: unknown): Promise<GeneratePacketPdfResult> {
  const parsed = GeneratePacketPdfSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  await requireOfficeStaff()
  const supabase = await createClient()

  // Fetch the job with company + contact + tenant joined. PostgREST resolves the
  // FK relations via embedded selects; RLS on each table still applies.
  const { data, error } = await supabase
    .from('jobs')
    .select(
      'id, job_number, job_name, description, customer_po_number, color, coating_type, part_count, weight_lbs, dimensions_text, due_date, priority, packet_token,' +
        'companies(name),' +
        'contacts(first_name, last_name),' +
        'tenants(name)'
    )
    .eq('id', parsed.data.job_id)
    .maybeSingle<JobJoinRow>()

  if (error) throw new Error(`Job lookup failed: ${error.message}`)
  if (!data) throw new Error('Job not found')
  if (!data.companies) throw new Error('Job missing company link')
  if (!data.tenants) throw new Error('Job missing tenant link')

  // Render QR (PNG data URL — react-pdf can't embed SVG natively).
  const qrPngDataUrl = await regenerateQrPngDataUrl(data.packet_token)

  // Lazy-load the heavy renderer + the document component. Per DESIGN.md, this
  // keeps the cold-start cost out of the rest of the app.
  const [{ renderToBuffer }, { PacketDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../components/PacketDocument'),
  ])

  const contactName = data.contacts
    ? [data.contacts.first_name, data.contacts.last_name].filter(Boolean).join(' ')
    : null

  const pdf = await renderToBuffer(
    PacketDocument({
      job: {
        job_number: data.job_number,
        job_name: data.job_name,
        description: data.description,
        customer_po_number: data.customer_po_number,
        company_name: data.companies.name,
        contact_name: contactName,
        color: data.color,
        coating_type: data.coating_type,
        part_count: data.part_count,
        weight_lbs: data.weight_lbs != null ? Number(data.weight_lbs) : null,
        dimensions_text: data.dimensions_text,
        due_date: data.due_date,
        priority: data.priority,
        packet_token: data.packet_token,
      },
      tenant: { tenant_name: data.tenants.name },
      qrPngDataUrl,
      generatedAt: new Date().toISOString(),
    })
  )

  // Mark packet as fresh — packet_dirty is allowed to write (only production_status is REVOKE'd).
  const { error: clearError } = await supabase
    .from('jobs')
    .update({ packet_dirty: false })
    .eq('id', parsed.data.job_id)

  if (clearError) {
    // PDF was generated successfully; log but don't bubble — caller still gets the buffer.
    // Future: surface this as a non-fatal warning channel.
    await logAuditEvent({
      action: 'update',
      entity_type: 'job',
      entity_id: parsed.data.job_id,
      changed_fields: { packet_dirty: 'clear-failed', error: clearError.message },
    })
  } else {
    await logAuditEvent({
      action: 'update',
      entity_type: 'job',
      entity_id: parsed.data.job_id,
      changed_fields: { packet_dirty: false },
    })
  }

  return {
    pdf,
    job_number: data.job_number,
    packet_token: data.packet_token,
  }
}
