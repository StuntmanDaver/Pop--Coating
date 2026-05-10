'use server'
import { z } from 'zod'
import { createClient } from '@/shared/db/server'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'
import { logAuditEvent } from '@/shared/audit'
import type { Database } from '@/shared/db/types'

// Source: docs/DESIGN.md §3.3 contacts (lines 491–516).
// DB invariant: UNIQUE INDEX one_primary_per_company on (company_id) WHERE is_primary AND archived_at IS NULL.
// We do not enforce this app-side; the DB raises and we surface the error verbatim.

type ContactUpdatePayload = Database['public']['Tables']['contacts']['Update']

const CreateContactSchema = z.object({
  company_id: z.string().uuid(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().max(100).nullish(),
  email: z.string().email().max(200).nullish(),
  phone: z.string().max(50).nullish(),
  role: z.string().max(100).nullish(),
  is_primary: z.boolean().optional(),
  notes: z.string().max(5000).nullish(),
})

export type CreateContactInput = z.infer<typeof CreateContactSchema>

const UpdateContactSchema = CreateContactSchema.partial().extend({
  id: z.string().uuid(),
})

export type UpdateContactInput = z.infer<typeof UpdateContactSchema>

const ArchiveContactSchema = z.object({ id: z.string().uuid() })

interface ContactRow {
  id: string
  tenant_id: string
  company_id: string
  first_name: string
}

export async function createContact(input: unknown): Promise<ContactRow> {
  const parsed = CreateContactSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  await requireOfficeStaff()
  const claims = await getCurrentClaims()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contacts')
    .insert({
      tenant_id: claims.tenant_id,
      company_id: parsed.data.company_id,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name ?? null,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      role: parsed.data.role ?? null,
      is_primary: parsed.data.is_primary ?? false,
      notes: parsed.data.notes ?? null,
    })
    .select('id, tenant_id, company_id, first_name')
    .single()

  if (error || !data) throw new Error(`Contact insert failed: ${error?.message ?? 'unknown'}`)

  await logAuditEvent({ action: 'create', entity_type: 'contact', entity_id: data.id })
  return data
}

export async function updateContact(input: unknown): Promise<ContactRow> {
  const parsed = UpdateContactSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  await requireOfficeStaff()
  const supabase = await createClient()

  const { id, ...patch } = parsed.data
  const updateRow = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined)
  ) as ContactUpdatePayload

  const { data, error } = await supabase
    .from('contacts')
    .update(updateRow)
    .eq('id', id)
    .select('id, tenant_id, company_id, first_name')
    .single()

  if (error || !data) throw new Error(`Contact update failed: ${error?.message ?? 'unknown'}`)

  await logAuditEvent({
    action: 'update',
    entity_type: 'contact',
    entity_id: id,
    changed_fields: updateRow as Record<string, unknown>,
  })
  return data
}

export async function archiveContact(input: unknown): Promise<{ id: string }> {
  const parsed = ArchiveContactSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  await requireOfficeStaff()
  const supabase = await createClient()

  const { error } = await supabase
    .from('contacts')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', parsed.data.id)

  if (error) throw new Error(`Contact archive failed: ${error.message}`)

  await logAuditEvent({ action: 'archive', entity_type: 'contact', entity_id: parsed.data.id })
  return { id: parsed.data.id }
}
