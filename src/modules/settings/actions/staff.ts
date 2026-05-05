'use server'
import { z } from 'zod'
import { createClient } from '@/shared/db/server'
import { createServiceClient } from '@/shared/db/admin' // service-role allowed in settings per CLAUDE.md
import { requireOfficeStaff } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'
import { logAuditEvent } from '@/shared/audit'
import type { Database } from '@/shared/db/types'

type StaffUpdatePayload = Database['public']['Tables']['staff']['Update']

// Source: docs/DESIGN.md §3.3 staff + §4.3 Module 8 (Settings) staff CRUD.
//
// Invite flow: insert staff row first (tenant_id, email, name, role) — auth_user_id
// is NULL until the invitee accepts the magic link. Then dispatch the invite via
// auth.admin.inviteUserByEmail with app_metadata={tenant_id, intended_actor:'staff'}
// so the auth-hook can link the new auth.users row back to staff.id at first login.

const StaffRoleSchema = z.enum(['admin', 'manager', 'office', 'shop'])
// 'tenant_admin' / 'agency_super_admin' provisioned out-of-band; not exposed to UI here.

const InviteStaffSchema = z.object({
  email: z.string().email().max(200),
  name: z.string().min(1).max(200),
  role: StaffRoleSchema,
  phone: z.string().max(50).nullish(),
})

export type InviteStaffInput = z.infer<typeof InviteStaffSchema>

const UpdateStaffSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(50).nullish(),
  role: StaffRoleSchema.optional(),
})

export type UpdateStaffInput = z.infer<typeof UpdateStaffSchema>

const DeactivateStaffSchema = z.object({ id: z.string().uuid() })

interface StaffInviteResult {
  staff: { id: string; tenant_id: string; email: string; role: string }
  auth_user_id: string
  invite_link: string | null
}

export async function inviteStaff(input: unknown): Promise<StaffInviteResult> {
  const parsed = InviteStaffSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  await requireOfficeStaff()
  const claims = await getCurrentClaims()
  const supabase = await createClient()
  const supabaseAdmin = createServiceClient()

  // Step 1: insert the staff row (auth_user_id NULL until link trigger fires at acceptance).
  const { data: staff, error: insertError } = await supabase
    .from('staff')
    .insert({
      tenant_id: claims.tenant_id,
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
      phone: parsed.data.phone ?? null,
    })
    .select('id, tenant_id, email, role')
    .single()

  if (insertError || !staff) {
    throw new Error(`Staff insert failed: ${insertError?.message ?? 'unknown'}`)
  }

  // Step 2: createUser with app_metadata BAKED IN at creation. CRITICAL — the
  // link_auth_user_to_actor trigger (migration 0010) fires AFTER INSERT on
  // auth.users and REQUIRES app_metadata.tenant_id. inviteUserByEmail does NOT
  // accept app_metadata, so it would raise 'auth_user_created_without_tenant_id'.
  // Pattern matches scripts/seed-tenant.ts (RESEARCH.md Pitfall 5).
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: parsed.data.email,
    email_confirm: true,
    user_metadata: { name: parsed.data.name },
    app_metadata: {
      tenant_id: claims.tenant_id,
      intended_actor: 'staff',
    },
  })

  if (createError || !created?.user) {
    // Roll back the staff row to avoid an orphaned record blocking re-invite.
    await supabase.from('staff').delete().eq('id', staff.id)
    throw new Error(`Auth user creation failed: ${createError?.message ?? 'no user returned'}`)
  }

  // Step 3: generate an invite link that lets the staff member set a password.
  // Supabase dispatches the email via the configured SMTP provider (Resend per
  // CLAUDE.md). The action_link is also returned for in-band display when SMTP
  // is unavailable (e.g., dev).
  const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'invite',
    email: parsed.data.email,
  })

  if (linkError) {
    // Auth user exists at this point — don't roll back; just surface the error.
    throw new Error(`Invite link dispatch failed: ${linkError.message}`)
  }

  await logAuditEvent({ action: 'invite', entity_type: 'staff', entity_id: staff.id })

  return {
    staff,
    auth_user_id: created.user.id,
    invite_link: link?.properties?.action_link ?? null,
  }
}

export async function updateStaff(input: unknown): Promise<{ id: string }> {
  const parsed = UpdateStaffSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  await requireOfficeStaff()
  const supabase = await createClient()

  const { id, ...patch } = parsed.data
  const updateRow = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined)
  ) as StaffUpdatePayload

  const { error } = await supabase.from('staff').update(updateRow).eq('id', id)
  if (error) throw new Error(`Staff update failed: ${error.message}`)

  await logAuditEvent({
    action: 'update',
    entity_type: 'staff',
    entity_id: id,
    changed_fields: updateRow,
  })
  return { id }
}

export async function deactivateStaff(input: unknown): Promise<{ id: string }> {
  const parsed = DeactivateStaffSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  await requireOfficeStaff()
  const supabase = await createClient()

  const { error } = await supabase
    .from('staff')
    .update({ is_active: false, archived_at: new Date().toISOString() })
    .eq('id', parsed.data.id)

  if (error) throw new Error(`Staff deactivate failed: ${error.message}`)

  await logAuditEvent({ action: 'deactivate', entity_type: 'staff', entity_id: parsed.data.id })
  return { id: parsed.data.id }
}
