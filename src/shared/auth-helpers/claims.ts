// src/shared/auth-helpers/claims.ts
import { createClient } from '@/shared/db/server'

export type JWTClaims = {
  tenant_id: string
  audience: 'staff_office' | 'staff_shop' | 'customer'
  role: string
  staff_id?: string
  workstation_id?: string
  company_id?: string
  customer_user_id?: string
}

export async function getCurrentClaims(): Promise<JWTClaims> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const meta = user.app_metadata
  return {
    tenant_id: meta.tenant_id as string,
    audience: meta.audience as 'staff_office' | 'staff_shop' | 'customer',
    role: meta.role as string,
    staff_id: meta.staff_id as string | undefined,
    workstation_id: meta.workstation_id as string | undefined,
    company_id: meta.company_id as string | undefined,
    customer_user_id: meta.customer_user_id as string | undefined,
  }
}
