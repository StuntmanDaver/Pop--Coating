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
//   3. INSERT tenant_domains rows (app.popsindustrial.com + track.popsindustrial.com)
//   4. INSERT staff row (role='admin', is_active=true, auth_user_id=NULL)
//   5. Create owner auth user with app_metadata already stamped
//   6. Generate a recovery link for password setup
//   7. Ensure smoke data: company, contact, customer user, shop employee,
//      workstation synthetic auth user, and one scheduled job with packet token.

import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import { parseArgs } from 'node:util'

const APP_HOST = 'app.popsindustrial.com'
const PORTAL_HOST = 'track.popsindustrial.com'
const SMOKE_COMPANY_NAME = 'Pops Smoke Test Customer'
const SMOKE_CONTACT_EMAIL = 'smoke.customer@example.com'
const SMOKE_EMPLOYEE_NAME = 'Smoke Floor Worker'
const SMOKE_WORKSTATION_NAME = 'Smoke Workstation'
const SMOKE_JOB_NAME = 'Smoke Test Packet Job'
// bcrypt hash for PIN 1234. This is smoke data only; rotate in production UI.
const SMOKE_PIN_HASH = '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiVEjrYt8CGRcBvO1lZPZK4u6tH3g4m'

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

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ─── Idempotency guard: continue if tenant already exists ────────────────
  const { data: existing, error: existingErr } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle()

  if (existingErr != null) {
    throw new Error(`tenants lookup failed: ${existingErr.message}`)
  }

  console.log(`Bootstrapping tenant: ${tenantName} (slug: ${slug})`)

  // ─── Step 1: Create tenants row ───────────────────────────────────────────
  const tenant = existing ?? await createTenant()

  async function createTenant() {
    const { data, error } = await supabase
      .from('tenants')
      .insert({ name: tenantName, slug })
      .select('id, name, slug')
      .single()

    if (error != null || data == null) {
      throw new Error(`tenants INSERT failed: ${error?.message ?? 'no data returned'}`)
    }

    return data
  }
  console.log(`  Tenant ready: id=${tenant.id}`)

  // ─── Step 2: Create shop_settings row ─────────────────────────────────────
  const { error: sErr } = await supabase
    .from('shop_settings')
    .upsert({ tenant_id: tenant.id }, { onConflict: 'tenant_id' })

  if (sErr != null) {
    throw new Error(`shop_settings INSERT failed: ${sErr.message}`)
  }
  console.log(`  shop_settings created for tenant ${tenant.id}`)

  // ─── Step 3: Create tenant_domains rows ───────────────────────────────────
  const { error: dErr } = await supabase
    .from('tenant_domains')
    .upsert([
      { tenant_id: tenant.id, host: APP_HOST, audience: 'staff' },
      { tenant_id: tenant.id, host: PORTAL_HOST, audience: 'customer' },
    ], { onConflict: 'host' })

  if (dErr != null) {
    // Log but don't throw — domains can be added manually if DNS is not yet configured
    console.warn(`  tenant_domains INSERT warning: ${dErr.message}`)
  } else {
    console.log(`  tenant_domains ready (${APP_HOST}, ${PORTAL_HOST})`)
  }

  // ─── Step 4: Create staff row (auth_user_id NULL until invite accepted) ───
  const { data: staff, error: stErr } = await supabase
    .from('staff')
    .upsert({
      tenant_id:  tenant.id,
      email:      ownerEmail,
      name:       ownerName,
      role:       'admin',
      is_active:  true,
    }, { onConflict: 'tenant_id,email' })
    .select()
    .single()

  if (stErr != null || staff == null) {
    throw new Error(`staff INSERT failed: ${stErr?.message ?? 'no data returned'}`)
  }
  console.log(`  Staff row ready: id=${staff.id}`)

  // ─── Step 5: Create owner with app_metadata BAKED IN at creation ──────────
  // CRITICAL: The link_auth_user_to_actor trigger (migration 0010) fires
  // AFTER INSERT on auth.users and REQUIRES app_metadata.tenant_id at that
  // moment. inviteUserByEmail creates the user without app_metadata, so
  // the trigger raises 'auth_user_created_without_tenant_id'. We must use
  // createUser with app_metadata in the first call. (RESEARCH.md Pitfall 5)
  const { data: existingUsers, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr != null) {
    throw new Error(`listUsers failed: ${listErr.message}`)
  }

  const existingOwner = existingUsers.users.find((user) => user.email === ownerEmail)
  const { data: created, error: cErr } = existingOwner
    ? { data: { user: existingOwner }, error: null }
    : await supabase.auth.admin.createUser({
        email:          ownerEmail,
        email_confirm:  true,
        user_metadata:  { name: ownerName },
        app_metadata:   { tenant_id: tenant.id, intended_actor: 'staff' },
      })

  if (cErr != null || created?.user == null) {
    throw new Error(`createUser failed: ${cErr?.message ?? 'no user returned'}`)
  }
  const authUserId = created.user.id
  console.log(`  Auth user ready: ${authUserId} (app_metadata stamped at creation)`)

  const { error: staffAuthErr } = await supabase
    .from('staff')
    .update({ auth_user_id: authUserId })
    .eq('id', staff.id)
    .is('auth_user_id', null)

  if (staffAuthErr != null) {
    throw new Error(`staff auth_user_id link failed: ${staffAuthErr.message}`)
  }

  // ─── Step 6: Generate invite/recovery link ────────────────────────────────
  // The user exists; generate a recovery (password-set) link so they can sign in.
  // generateLink does not send email; deliver this link manually or through a
  // follow-up Resend integration.
  const { data: link, error: lErr } = await supabase.auth.admin.generateLink({
    type:  'recovery',
    email: ownerEmail,
  })

  if (lErr != null) {
    throw new Error(`generateLink failed: ${lErr.message}`)
  }
  console.log(`  Recovery link generated for ${ownerEmail}`)
  console.log(`  (action_link in console: ${link?.properties?.action_link ?? 'n/a'})`)

  const { company, contact, customerUser, employee, workstation, job } = await ensureSmokeData()

  console.log('')
  console.log('Bootstrap complete.')
  console.log(`  Tenant:    ${tenantName} (${tenant.id})`)
  console.log(`  Staff row: ${staff.id} (${ownerEmail})`)
  console.log(`  Auth user: ${authUserId}`)
  console.log(`  Company:   ${company.id} (${company.name})`)
  console.log(`  Contact:   ${contact.id} (${contact.email ?? 'no email'})`)
  console.log(`  Customer:  ${customerUser.id} (${customerUser.email})`)
  console.log(`  Employee:  ${employee.id} (${employee.display_name}; smoke PIN 1234)`)
  console.log(`  Station:   ${workstation.id} (${workstation.name})`)
  console.log(`  Job:       ${job.id} (${job.job_number})`)
  console.log(`  Packet QR: https://${APP_HOST}/scan?packet=${job.packet_token}`)
  console.log('')
  console.log('Next steps:')
  console.log('  1. Owner checks email and clicks the invite link to set a password.')
  console.log('  2. On first sign-in, the link_auth_user_to_actor trigger links')
  console.log(`     auth.users.id=${authUserId} → staff.auth_user_id.`)
  console.log('  3. The custom_access_token_hook stamps tenant_id + audience=staff_office')
  console.log('     into the JWT on every subsequent sign-in.')
  console.log('  4. Register the Auth Hook in Supabase Dashboard → Authentication → Hooks.')
  console.log('     (Plan 06 Task 2 manual checkpoint)')

  async function ensureSmokeData() {
    const { data: existingCompany, error: companyLookupErr } = await supabase
      .from('companies')
      .select('id, name')
      .eq('tenant_id', tenant.id)
      .eq('name', SMOKE_COMPANY_NAME)
      .maybeSingle()

    if (companyLookupErr != null) {
      throw new Error(`companies lookup failed: ${companyLookupErr.message}`)
    }

    const company = existingCompany ?? await createSmokeCompany()

    async function createSmokeCompany() {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          tenant_id: tenant.id,
          name: SMOKE_COMPANY_NAME,
          email: 'ops@smoke-customer.example',
          phone: '555-0100',
          shipping_city: 'Lakeland',
          shipping_state: 'FL',
          shipping_zip: '33811',
          payment_terms: 'Net 30',
          notes: 'Seeded smoke customer for production-readiness verification.',
        })
        .select('id, name')
        .single()

      if (error != null || data == null) {
        throw new Error(`companies INSERT failed: ${error?.message ?? 'no data returned'}`)
      }

      return data
    }

    const { data: existingContact, error: contactLookupErr } = await supabase
      .from('contacts')
      .select('id, email')
      .eq('tenant_id', tenant.id)
      .eq('company_id', company.id)
      .eq('email', SMOKE_CONTACT_EMAIL)
      .maybeSingle()

    if (contactLookupErr != null) {
      throw new Error(`contacts lookup failed: ${contactLookupErr.message}`)
    }

    const contact = existingContact ?? await createSmokeContact(company.id)

    async function createSmokeContact(companyId: string) {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          tenant_id: tenant.id,
          company_id: companyId,
          first_name: 'Smoke',
          last_name: 'Customer',
          email: SMOKE_CONTACT_EMAIL,
          phone: '555-0101',
          role: 'Operations',
          is_primary: true,
        })
        .select('id, email')
        .single()

      if (error != null || data == null) {
        throw new Error(`contacts INSERT failed: ${error?.message ?? 'no data returned'}`)
      }

      return data
    }

    const { data: customerUser, error: customerErr } = await supabase
      .from('customer_users')
      .upsert({
        tenant_id: tenant.id,
        company_id: company.id,
        contact_id: contact.id,
        email: SMOKE_CONTACT_EMAIL,
        name: 'Smoke Customer',
        is_active: true,
      }, { onConflict: 'tenant_id,email' })
      .select('id, email')
      .single()

    if (customerErr != null || customerUser == null) {
      throw new Error(`customer_users UPSERT failed: ${customerErr?.message ?? 'no data returned'}`)
    }

    const { data: existingEmployee, error: employeeLookupErr } = await supabase
      .from('shop_employees')
      .select('id, display_name')
      .eq('tenant_id', tenant.id)
      .eq('display_name', SMOKE_EMPLOYEE_NAME)
      .maybeSingle()

    if (employeeLookupErr != null) {
      throw new Error(`shop_employees lookup failed: ${employeeLookupErr.message}`)
    }

    const employee = existingEmployee ?? await createSmokeEmployee()

    async function createSmokeEmployee() {
      const { data, error } = await supabase
        .from('shop_employees')
        .insert({
          tenant_id: tenant.id,
          display_name: SMOKE_EMPLOYEE_NAME,
          pin_hash: SMOKE_PIN_HASH,
          is_active: true,
        })
        .select('id, display_name')
        .single()

      if (error != null || data == null) {
        throw new Error(`shop_employees INSERT failed: ${error?.message ?? 'no data returned'}`)
      }

      return data
    }

    const { data: existingWorkstation, error: workstationLookupErr } = await supabase
      .from('workstations')
      .select('id, name')
      .eq('tenant_id', tenant.id)
      .eq('name', SMOKE_WORKSTATION_NAME)
      .maybeSingle()

    if (workstationLookupErr != null) {
      throw new Error(`workstations lookup failed: ${workstationLookupErr.message}`)
    }

    const workstation = existingWorkstation ?? await createSmokeWorkstation()

    async function createSmokeWorkstation() {
      const deviceToken = randomBytes(36).toString('base64url')
      const workstationEmail = `workstation-${slug}-smoke@workstations.${slug}.local`
      const { data: users, error: usersErr } = await supabase.auth.admin.listUsers()
      if (usersErr != null) {
        throw new Error(`listUsers for workstation failed: ${usersErr.message}`)
      }

      const existingAuthUser = users.users.find((user) => user.email === workstationEmail)
      if (existingAuthUser) {
        throw new Error(
          `workstation auth user ${workstationEmail} already exists but no matching workstation row was found`
        )
      }

      const { data: workstationAuth, error: wsAuthErr } = await supabase.auth.admin.createUser({
        email: workstationEmail,
        password: deviceToken,
        email_confirm: true,
        app_metadata: { tenant_id: tenant.id, intended_actor: 'workstation' },
      })

      if (wsAuthErr != null || workstationAuth?.user == null) {
        throw new Error(`workstation auth user failed: ${wsAuthErr?.message ?? 'no user returned'}`)
      }

      const { data, error } = await supabase
        .from('workstations')
        .insert({
          tenant_id: tenant.id,
          auth_user_id: workstationAuth.user.id,
          name: SMOKE_WORKSTATION_NAME,
          default_stage: 'received',
          physical_location: 'Smoke test bench',
          device_token: deviceToken,
          is_active: true,
        })
        .select('id, name')
        .single()

      if (error != null || data == null) {
        throw new Error(`workstations INSERT failed: ${error?.message ?? 'no data returned'}`)
      }

      return data
    }

    const packetToken = randomBytes(12).toString('base64url').slice(0, 16)
    const { data: existingJob, error: jobLookupErr } = await supabase
      .from('jobs')
      .select('id, job_number, packet_token')
      .eq('tenant_id', tenant.id)
      .eq('job_name', SMOKE_JOB_NAME)
      .maybeSingle()

    if (jobLookupErr != null) {
      throw new Error(`jobs lookup failed: ${jobLookupErr.message}`)
    }

    const job = existingJob ?? await createSmokeJob(packetToken, company.id, contact.id)
    return { company, contact, customerUser, employee, workstation, job }
  }

  async function createSmokeJob(packetToken: string, companyId: string, contactId: string) {
    const jobNumber = await nextSeedJobNumber()
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        tenant_id: tenant.id,
        job_number: jobNumber,
        packet_token: packetToken,
        company_id: companyId,
        contact_id: contactId,
        job_name: SMOKE_JOB_NAME,
        description: 'Seeded smoke job for packet, portal, and scanner verification.',
        part_count: 1,
        parts_received_count: 1,
        priority: 'normal',
        intake_status: 'scheduled',
        notes: 'Created by scripts/seed-tenant.ts production-readiness smoke bootstrap.',
        created_by_staff_id: staff.id,
      })
      .select('id, job_number, packet_token')
      .single()

    if (error != null || data == null) {
      throw new Error(`jobs INSERT failed: ${error?.message ?? 'no data returned'}`)
    }

    return data
  }

  async function nextSeedJobNumber(): Promise<string> {
    const currentYear = new Date().getFullYear()
    const { data: settings, error: settingsErr } = await supabase
      .from('shop_settings')
      .select('job_number_prefix, job_number_seq, job_number_year')
      .eq('tenant_id', tenant.id)
      .single()

    if (settingsErr != null || settings == null) {
      throw new Error(`shop_settings lookup failed: ${settingsErr?.message ?? 'no data returned'}`)
    }

    const nextSeq = settings.job_number_year < currentYear ? 1 : settings.job_number_seq + 1
    const { error: updateErr } = await supabase
      .from('shop_settings')
      .update({
        job_number_year: currentYear,
        job_number_seq: nextSeq,
        is_first_job_created: true,
      })
      .eq('tenant_id', tenant.id)

    if (updateErr != null) {
      throw new Error(`shop_settings job sequence update failed: ${updateErr.message}`)
    }

    return `${settings.job_number_prefix}-${currentYear}-${String(nextSeq).padStart(5, '0')}`
  }
}

main().catch((err: unknown) => {
  console.error('seed-tenant failed:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
