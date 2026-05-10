// src/shared/auth-helpers/require.ts
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/shared/db/server'
import { redirect } from 'next/navigation'

export async function requireOfficeStaff() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/sign-in')
  const audience = user.app_metadata?.audience
  if (audience !== 'staff_office') redirect('/sign-in')
  Sentry.setTag('tenant_id', String(user.app_metadata?.tenant_id ?? 'unknown'))
  return user
}

export async function requireShopStaff() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/scan')
  if (user.app_metadata?.audience !== 'staff_shop') redirect('/scan')
  Sentry.setTag('tenant_id', String(user.app_metadata?.tenant_id ?? 'unknown'))
  return user
}

export async function requireCustomer() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/sign-in')
  if (user.app_metadata?.audience !== 'customer') redirect('/sign-in')
  Sentry.setTag('tenant_id', String(user.app_metadata?.tenant_id ?? 'unknown'))
  return user
}
