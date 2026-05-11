import 'server-only'
import { z } from 'zod'
import { createClient } from '@/shared/db/server'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'

// RLS enforces tenant isolation on every read; queries do not pass tenant_id explicitly.

const ListCompaniesParamsSchema = z.object({
  q: z.string().max(200).optional(),
  include_archived: z.boolean().default(false),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
})

export type ListCompaniesParams = z.infer<typeof ListCompaniesParamsSchema>

export interface CompanyListItem {
  id: string
  name: string
  phone: string | null
  email: string | null
  archived_at: string | null
  created_at: string
}

export async function listCompanies(params: unknown = {}): Promise<CompanyListItem[]> {
  const parsed = ListCompaniesParamsSchema.parse(params)
  await requireOfficeStaff()
  const supabase = await createClient()

  let query = supabase
    .from('companies')
    .select('id, name, phone, email, archived_at, created_at')
    .order('name', { ascending: true })
    .range(parsed.offset, parsed.offset + parsed.limit - 1)

  if (!parsed.include_archived) query = query.is('archived_at', null)
  if (parsed.q) query = query.ilike('name', `%${parsed.q}%`)

  const { data, error } = await query
  if (error) throw new Error(`Company list failed: ${error.message}`)
  return data ?? []
}

const GetCompanyByIdSchema = z.object({ id: z.string().uuid() })

export async function getCompanyById(input: unknown) {
  const parsed = GetCompanyByIdSchema.parse(input)
  await requireOfficeStaff()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', parsed.id)
    .maybeSingle()

  if (error) throw new Error(`Company fetch failed: ${error.message}`)
  return data
}
