// src/shared/auth-helpers/require.ts
import { createClient } from '@/shared/db/server'
import { redirect } from 'next/navigation'

export async function requireOfficeStaff() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/sign-in')
  const audience = user.app_metadata?.audience
  if (audience !== 'staff_office') {
    throw new Error('Access denied: office staff only')
  }
  return user
}

export async function requireShopStaff() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/scan')
  if (user.app_metadata?.audience !== 'staff_shop') {
    throw new Error('Access denied: shop staff only')
  }
  return user
}

export async function requireCustomer() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/sign-in')
  if (user.app_metadata?.audience !== 'customer') {
    throw new Error('Access denied: customer only')
  }
  return user
}
