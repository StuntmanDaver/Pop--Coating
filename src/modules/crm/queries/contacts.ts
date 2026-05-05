import 'server-only'
import { z } from 'zod'
import { createClient } from '@/shared/db/server'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'
import { escapeForOr } from '@/shared/db/postgrest'

const ListContactsParamsSchema = z.object({
  company_id: z.string().uuid().optional(),
  q: z.string().max(200).optional(),
  include_archived: z.boolean().default(false),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
})

export type ListContactsParams = z.infer<typeof ListContactsParamsSchema>

export interface ContactListItem {
  id: string
  company_id: string
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  is_primary: boolean
  archived_at: string | null
}

export async function listContacts(params: unknown = {}): Promise<ContactListItem[]> {
  const parsed = ListContactsParamsSchema.parse(params)
  await requireOfficeStaff()
  const supabase = await createClient()

  let query = supabase
    .from('contacts')
    .select('id, company_id, first_name, last_name, email, phone, is_primary, archived_at')
    .order('is_primary', { ascending: false })
    .order('last_name', { ascending: true })
    .range(parsed.offset, parsed.offset + parsed.limit - 1)

  if (parsed.company_id) query = query.eq('company_id', parsed.company_id)
  if (!parsed.include_archived) query = query.is('archived_at', null)
  if (parsed.q) {
    const q = escapeForOr(parsed.q)
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(`Contact list failed: ${error.message}`)
  return data ?? []
}

const GetContactByIdSchema = z.object({ id: z.string().uuid() })

export async function getContactById(input: unknown) {
  const parsed = GetContactByIdSchema.parse(input)
  await requireOfficeStaff()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', parsed.id)
    .maybeSingle()

  if (error) throw new Error(`Contact fetch failed: ${error.message}`)
  return data
}
