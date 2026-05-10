'use server'
import { z } from 'zod'
import { createClient } from '@/shared/db/server'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'
import { logAuditEvent } from '@/shared/audit'
import type { Database } from '@/shared/db/types'

type CompanyUpdatePayload = Database['public']['Tables']['companies']['Update']

// Source: docs/DESIGN.md §3.3 companies (lines 467–489) + §4.3 Module 2 (CRM).
// RLS in 0006_rls_policies.sql enforces tenant isolation; we still set tenant_id
// explicitly on INSERT so the WITH CHECK predicate (tenant_id = app.tenant_id()) holds.

const CompanyAddressSchema = z.object({
  shipping_address: z.string().max(500).nullish(),
  shipping_city: z.string().max(100).nullish(),
  shipping_state: z.string().max(50).nullish(),
  shipping_zip: z.string().max(20).nullish(),
  billing_address: z.string().max(500).nullish(),
  billing_city: z.string().max(100).nullish(),
  billing_state: z.string().max(50).nullish(),
  billing_zip: z.string().max(20).nullish(),
})

const CreateCompanySchema = z
  .object({
    name: z.string().min(1).max(200),
    phone: z.string().max(50).nullish(),
    email: z.string().email().max(200).nullish(),
    tax_id: z.string().max(50).nullish(),
    payment_terms: z.string().max(100).nullish(),
    customer_since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
    notes: z.string().max(5000).nullish(),
  })
  .merge(CompanyAddressSchema)

export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>

const UpdateCompanySchema = CreateCompanySchema.partial().extend({
  id: z.string().uuid(),
})

export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>

const ArchiveCompanySchema = z.object({ id: z.string().uuid() })

interface CompanyRow {
  id: string
  tenant_id: string
  name: string
}

export async function createCompany(input: unknown): Promise<CompanyRow> {
  const parsed = CreateCompanySchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  await requireOfficeStaff()
  const claims = await getCurrentClaims()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('companies')
    .insert({
      tenant_id: claims.tenant_id,
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      email: parsed.data.email ?? null,
      tax_id: parsed.data.tax_id ?? null,
      payment_terms: parsed.data.payment_terms ?? null,
      customer_since: parsed.data.customer_since ?? null,
      notes: parsed.data.notes ?? null,
      shipping_address: parsed.data.shipping_address ?? null,
      shipping_city: parsed.data.shipping_city ?? null,
      shipping_state: parsed.data.shipping_state ?? null,
      shipping_zip: parsed.data.shipping_zip ?? null,
      billing_address: parsed.data.billing_address ?? null,
      billing_city: parsed.data.billing_city ?? null,
      billing_state: parsed.data.billing_state ?? null,
      billing_zip: parsed.data.billing_zip ?? null,
    })
    .select('id, tenant_id, name')
    .single()

  if (error || !data) throw new Error(`Company insert failed: ${error?.message ?? 'unknown'}`)

  await logAuditEvent({ action: 'create', entity_type: 'company', entity_id: data.id })
  return data
}

export async function updateCompany(input: unknown): Promise<CompanyRow> {
  const parsed = UpdateCompanySchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  await requireOfficeStaff()
  const supabase = await createClient()

  const { id, ...patch } = parsed.data
  const updateRow = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined)
  ) as CompanyUpdatePayload

  const { data, error } = await supabase
    .from('companies')
    .update(updateRow)
    .eq('id', id)
    .select('id, tenant_id, name')
    .single()

  if (error || !data) throw new Error(`Company update failed: ${error?.message ?? 'unknown'}`)

  await logAuditEvent({
    action: 'update',
    entity_type: 'company',
    entity_id: id,
    changed_fields: updateRow,
  })
  return data
}

export async function archiveCompany(input: unknown): Promise<{ id: string }> {
  const parsed = ArchiveCompanySchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  await requireOfficeStaff()
  const supabase = await createClient()

  const { error } = await supabase
    .from('companies')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', parsed.data.id)

  if (error) throw new Error(`Company archive failed: ${error.message}`)

  await logAuditEvent({ action: 'archive', entity_type: 'company', entity_id: parsed.data.id })
  return { id: parsed.data.id }
}
