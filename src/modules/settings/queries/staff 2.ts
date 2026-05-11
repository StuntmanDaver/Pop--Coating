import 'server-only'
import { z } from 'zod'
import { createClient } from '@/shared/db/server'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'

const ListStaffParamsSchema = z.object({
  include_inactive: z.boolean().default(false),
})

export type ListStaffParams = z.infer<typeof ListStaffParamsSchema>

export interface StaffListItem {
  id: string
  email: string
  name: string
  role: string
  phone: string | null
  is_active: boolean
  created_at: string
}

export async function listStaff(params: unknown = {}): Promise<StaffListItem[]> {
  const parsed = ListStaffParamsSchema.parse(params)
  await requireOfficeStaff()
  const supabase = await createClient()

  let query = supabase
    .from('staff')
    .select('id, email, name, role, phone, is_active, created_at')
    .order('name', { ascending: true })

  if (!parsed.include_inactive) query = query.eq('is_active', true).is('archived_at', null)

  const { data, error } = await query
  if (error) throw new Error(`Staff list failed: ${error.message}`)
  return data ?? []
}
