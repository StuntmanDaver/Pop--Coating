import 'server-only'
import { createClient } from '@/shared/db/server'
import { requireShopStaff } from '@/shared/auth-helpers/require'

export interface ShopEmployeeTile {
  id: string
  display_name: string
  avatar_url: string | null
  is_active: boolean
}

export async function listShopEmployees(): Promise<ShopEmployeeTile[]> {
  await requireShopStaff()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shop_employees')
    .select('id, display_name, avatar_url, is_active')
    .eq('is_active', true)
    .is('archived_at', null)
    .order('display_name', { ascending: true })
  if (error) throw new Error(`Employee list failed: ${error.message}`)
  return data ?? []
}
