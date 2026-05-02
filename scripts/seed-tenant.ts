// scripts/seed-tenant.ts
// Source: docs/DESIGN.md §9.6; CONTEXT.md D-10/D-11; 01-RESEARCH.md Pitfall 5
//
// Programmatic Tenant 1 bootstrap for the live Supabase Cloud project.
// Run with:
//   pnpm seed:tenant --tenant-name "Pops Industrial Coatings" \
//                    --slug pops-coating \
//                    --owner-email owner@example.com \
//                    --owner-name "Owner Name"
//
// Prerequisites:
//   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be set.
//   Resend SMTP must already be configured in Supabase Auth settings (D-01).
//
// What this script does (per CONTEXT.md D-10/D-11):
//   1. INSERT tenants row (auto-generated UUID, name, slug)
//   2. INSERT shop_settings row (tenant_id)
//   3. INSERT tenant_domains rows (app.popscoating.com + track.popscoating.com)
//   4. INSERT staff row (role='admin', is_active=true, auth_user_id=NULL)
//   5. auth.admin.inviteUserByEmail → dispatches invite via Resend SMTP
//   6. auth.admin.updateUserById → sets app_metadata.tenant_id + intended_actor='staff'
//      CRITICAL (RESEARCH.md Pitfall 5): this MUST happen before the user accepts the invite
//      so the link_auth_user_to_actor trigger (migration 0010) can link the auth.users
//      row to the staff row via tenant_id + email. Without this, the trigger raises
//      'auth_user_created_without_tenant_id'.

import { createClient } from '@supabase/supabase-js'
import { parseArgs } from 'node:util'

async function main() {
  const { values } = parseArgs({
    options: {
      'tenant-name': { type: 'string' },
      'slug':        { type: 'string' },
      'owner-email': { type: 'string' },
      'owner-name':  { type: 'string' },
    },
    strict: false,
  })

  // Cast to string | undefined — parseArgs typed options return string for type:'string';
  // strict:false widens the inferred union but at runtime these are always string | undefined.
  const tenantName = values['tenant-name'] as string | undefined
  const slug       = values['slug'] as string | undefined
  const ownerEmail = values['owner-email'] as string | undefined
  const ownerName  = values['owner-name'] as string | undefined

  if (!tenantName || !slug || !ownerEmail || !ownerName) {
    console.error(
      'Usage: pnpm seed:tenant ' +
      '--tenant-name <name> --slug <slug> --owner-email <email> --owner-name <name>'
    )
    process.exit(1)
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      'Missing required env vars: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) ' +
      'and SUPABASE_SERVICE_ROLE_KEY'
    )
    process.exit(1)
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- both vars validated above (non-null assertion safe)
  const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ─── Idempotency guard: check if tenant already bootstrapped ─────────────
  const { data: existing } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('slug', slug)
    .maybeSingle()

  if (existing != null) {
    console.log(`Tenant '${slug}' already exists (id=${existing.id}) — nothing to do.`)
    process.exit(0)
  }

  console.log(`Bootstrapping tenant: ${tenantName} (slug: ${slug})`)

  // ─── Step 1: Create tenants row ───────────────────────────────────────────
  const { data: tenant, error: tErr } = await supabase
    .from('tenants')
    .insert({ name: tenantName, slug })
    .select()
    .single()

  if (tErr != null || tenant == null) {
    throw new Error(`tenants INSERT failed: ${tErr?.message ?? 'no data returned'}`)
  }
  console.log(`  Tenant created: id=${tenant.id}`)

  // ─── Step 2: Create shop_settings row ─────────────────────────────────────
  const { error: sErr } = await supabase
    .from('shop_settings')
    .insert({ tenant_id: tenant.id })

  if (sErr != null) {
    throw new Error(`shop_settings INSERT failed: ${sErr.message}`)
  }
  console.log(`  shop_settings created for tenant ${tenant.id}`)

  // ─── Step 3: Create tenant_domains rows ───────────────────────────────────
  const { error: dErr } = await supabase
    .from('tenant_domains')
    .insert([
      { tenant_id: tenant.id, host: 'app.popscoating.com',   audience: 'staff'    },
      { tenant_id: tenant.id, host: 'track.popscoating.com', audience: 'customer' },
    ])

  if (dErr != null) {
    // Log but don't throw — domains can be added manually if DNS is not yet configured
    console.warn(`  tenant_domains INSERT warning: ${dErr.message}`)
  } else {
    console.log(`  tenant_domains created (app.popscoating.com, track.popscoating.com)`)
  }

  // ─── Step 4: Create staff row (auth_user_id NULL until invite accepted) ───
  const { data: staff, error: stErr } = await supabase
    .from('staff')
    .insert({
      tenant_id:  tenant.id,
      email:      ownerEmail,
      name:       ownerName,
      role:       'admin',
      is_active:  true,
    })
    .select()
    .single()

  if (stErr != null || staff == null) {
    throw new Error(`staff INSERT failed: ${stErr?.message ?? 'no data returned'}`)
  }
  console.log(`  Staff row created: id=${staff.id} (auth_user_id=NULL until invite accepted)`)

  // ─── Step 5: Invite owner via Supabase Auth (dispatched via Resend SMTP) ──
  const { data: invited, error: iErr } = await supabase.auth.admin.inviteUserByEmail(ownerEmail, {
    data: { name: ownerName },
  })

  if (iErr != null || invited?.user == null) {
    throw new Error(`inviteUserByEmail failed: ${iErr?.message ?? 'no user returned'}`)
  }
  const authUserId = invited.user.id
  console.log(`  Invite dispatched to ${ownerEmail} (auth.users.id=${authUserId})`)

  // ─── Step 6: CRITICAL — set app_metadata BEFORE invite link is clicked ────
  // The link_auth_user_to_actor trigger (migration 0010) fires on AFTER INSERT
  // on auth.users. inviteUserByEmail creates the auth.users row, then we
  // MUST set app_metadata.tenant_id + intended_actor so the trigger can link
  // the auth.users row to the staff row. Without this, the trigger raises
  // 'auth_user_created_without_tenant_id' when the owner clicks the invite link.
  // (RESEARCH.md Pitfall 5)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- authUserId validated above (invited.user.id is non-null after success check)
  const { error: updErr } = await supabase.auth.admin.updateUserById(authUserId!, {
    app_metadata: {
      tenant_id:      tenant.id,
      intended_actor: 'staff',
    },
  })

  if (updErr != null) {
    throw new Error(`updateUserById app_metadata failed: ${updErr.message}`)
  }
  console.log(`  app_metadata set: { tenant_id: "${tenant.id}", intended_actor: "staff" }`)

  console.log('')
  console.log('Bootstrap complete.')
  console.log(`  Tenant:    ${tenantName} (${tenant.id})`)
  console.log(`  Staff row: ${staff.id} (${ownerEmail})`)
  console.log(`  Auth user: ${authUserId}`)
  console.log('')
  console.log('Next steps:')
  console.log('  1. Owner checks email and clicks the invite link to set a password.')
  console.log('  2. On first sign-in, the link_auth_user_to_actor trigger links')
  console.log(`     auth.users.id=${authUserId} → staff.auth_user_id.`)
  console.log('  3. The custom_access_token_hook stamps tenant_id + audience=staff_office')
  console.log('     into the JWT on every subsequent sign-in.')
  console.log('  4. Register the Auth Hook in Supabase Dashboard → Authentication → Hooks.')
  console.log('     (Plan 06 Task 2 manual checkpoint)')
}

main().catch((err: unknown) => {
  console.error('seed-tenant failed:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
