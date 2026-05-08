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
//   1. INSERT or verify tenants row (auto-generated UUID, name, slug)
//   2. INSERT or verify shop_settings row (tenant_id)
//   3. INSERT or verify tenant_domains rows (app.popsindustrial.com + track.popsindustrial.com)
//   4. INSERT or verify staff row (role='admin', is_active=true)
//   5. Create or verify owner auth user with app_metadata stamped
//   6. Generate a recovery link for password setup without printing it
//   7. Ensure smoke data: company, contact, customer user, shop employee,
//      customer auth user, workstation synthetic auth user, and one scheduled
//      job with packet token.

import { createClient, type User } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import { parseArgs } from 'node:util'
import type { Database } from '../src/shared/db/types'

const APP_HOST = 'app.popsindustrial.com'
const PORTAL_HOST = 'track.popsindustrial.com'
const SMOKE_COMPANY_NAME = 'Pops Smoke Test Customer'
const SMOKE_CONTACT_EMAIL = 'smoke.customer@example.com'
const SMOKE_EMPLOYEE_NAME = 'Smoke Floor Worker'
const SMOKE_WORKSTATION_NAME = 'Smoke Workstation'
const SMOKE_JOB_NAME = 'Smoke Test Packet Job'
// bcrypt hash for PIN 1234. This is smoke data only; rotate in production UI.
const SMOKE_PIN_HASH = '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiVEjrYt8CGRcBvO1lZPZK4u6tH3g4m'

type AuthUserSummary = {
  id: string
  email?: string
  appMetadata: Record<string, unknown>
}

type TenantDomainAudience = 'staff' | 'customer'

type ExistingTenant = {
  id: string
  name: string
  slug: string
}

type ExistingWorkstation = {
  id: string
  auth_user_id: string | null
  device_token: string
  name: string
}

type ExistingSeedJob = {
  id: string
  job_number: string
  packet_token: string
  company_id: string
  contact_id: string | null
}

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

  const tenantNameArg: string = tenantName
  const slugArg: string = slug
  const ownerEmailArg: string = ownerEmail
  const ownerNameArg: string = ownerName

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      'Missing required env vars: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) ' +
      'and SUPABASE_SERVICE_ROLE_KEY'
    )
    process.exit(1)
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ─── Idempotency guard: continue if tenant already exists ────────────────
  const { data: existing, error: existingErr } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .eq('slug', slugArg)
    .maybeSingle()

  if (existingErr != null) {
    throw new Error(`tenants lookup failed: ${existingErr.message}`)
  }

  console.log(`Bootstrapping tenant: ${tenantNameArg} (slug: ${slugArg})`)

  // ─── Step 1: Create or verify tenants row ────────────────────────────────
  const tenant = existing == null ? await createTenant() : await verifyTenant(existing)

  async function createTenant() {
    const { data, error } = await supabase
      .from('tenants')
      .insert({ name: tenantNameArg, slug: slugArg })
      .select('id, name, slug')
      .single()

    if (error != null || data == null) {
      throw new Error(`tenants INSERT failed: ${error?.message ?? 'no data returned'}`)
    }

    return data
  }

  async function verifyTenant(existingTenant: ExistingTenant) {
    if (existingTenant.name === tenantNameArg) {
      return existingTenant
    }

    const { data, error } = await supabase
      .from('tenants')
      .update({ name: tenantNameArg })
      .eq('id', existingTenant.id)
      .select('id, name, slug')
      .single()

    if (error != null || data == null) {
      throw new Error(`tenants verification failed: ${error?.message ?? 'no data returned'}`)
    }

    return data
  }
  console.log(`  Tenant ready: id=${tenant.id}`)

  // ─── Step 2: Create or verify shop_settings row ──────────────────────────
  const { data: shopSettings, error: sErr } = await supabase
    .from('shop_settings')
    .upsert({ tenant_id: tenant.id }, { onConflict: 'tenant_id' })
    .select('tenant_id')
    .single()

  if (sErr != null || shopSettings == null) {
    throw new Error(`shop_settings verification failed: ${sErr?.message ?? 'no data returned'}`)
  }
  console.log(`  shop_settings ready for tenant ${tenant.id}`)

  // ─── Step 3: Create or verify tenant_domains rows ────────────────────────
  await ensureTenantDomain(APP_HOST, 'staff')
  await ensureTenantDomain(PORTAL_HOST, 'customer')
  console.log(`  tenant_domains ready (${APP_HOST}, ${PORTAL_HOST})`)

  async function ensureTenantDomain(host: string, audience: TenantDomainAudience) {
    const { data: existingDomain, error: domainLookupErr } = await supabase
      .from('tenant_domains')
      .select('id, tenant_id, host, audience')
      .eq('host', host)
      .maybeSingle()

    if (domainLookupErr != null) {
      throw new Error(`tenant_domains lookup failed for ${host}: ${domainLookupErr.message}`)
    }

    if (existingDomain == null) {
      const { error: insertErr } = await supabase
        .from('tenant_domains')
        .insert({ tenant_id: tenant.id, host, audience })

      if (insertErr != null) {
        throw new Error(`tenant_domains INSERT failed for ${host}: ${insertErr.message}`)
      }
      return
    }

    if (existingDomain.tenant_id !== tenant.id) {
      throw new Error(
        `tenant_domains verification failed: ${host} belongs to another tenant (${existingDomain.tenant_id})`
      )
    }

    if (existingDomain.audience !== audience) {
      const { error: updateErr } = await supabase
        .from('tenant_domains')
        .update({ audience })
        .eq('id', existingDomain.id)

      if (updateErr != null) {
        throw new Error(`tenant_domains audience update failed for ${host}: ${updateErr.message}`)
      }
    }
  }

  // ─── Step 4: Create or verify staff row ──────────────────────────────────
  const { data: staff, error: stErr } = await supabase
    .from('staff')
    .upsert({
      tenant_id:  tenant.id,
      email:      ownerEmailArg,
      name:       ownerNameArg,
      role:       'admin',
      is_active:  true,
    }, { onConflict: 'tenant_id,email' })
    .select('id, tenant_id, auth_user_id, email, name, role, is_active')
    .single()

  if (stErr != null || staff == null) {
    throw new Error(`staff verification failed: ${stErr?.message ?? 'no data returned'}`)
  }
  const staffRow = staff
  console.log(`  Staff row ready: id=${staffRow.id}`)

  // ─── Step 5: Create owner with app_metadata BAKED IN at creation ──────────
  // CRITICAL: The link_auth_user_to_actor trigger (migration 0010) fires
  // AFTER INSERT on auth.users and REQUIRES app_metadata.tenant_id at that
  // moment. inviteUserByEmail creates the user without app_metadata, so
  // the trigger raises 'auth_user_created_without_tenant_id'. We must use
  // createUser with app_metadata in the first call. (RESEARCH.md Pitfall 5)
  const existingOwner = await findAuthUserByEmail(ownerEmailArg)
  const ownerAuthUser = existingOwner ?? await createOwnerAuthUser()
  await ensureAuthUserAppMetadata(ownerAuthUser, {
    tenant_id: tenant.id,
    intended_actor: 'staff',
  }, 'owner auth user')

  const authUserId = ownerAuthUser.id
  console.log(`  Auth user ready: ${authUserId} (app_metadata verified)`)

  const { data: linkedStaff, error: staffAuthErr } = await supabase
    .from('staff')
    .update({ auth_user_id: authUserId })
    .eq('id', staffRow.id)
    .select('id, auth_user_id')
    .single()

  if (staffAuthErr != null || linkedStaff?.auth_user_id !== authUserId) {
    throw new Error(`staff auth_user_id verification failed: ${staffAuthErr?.message ?? 'link mismatch'}`)
  }

  async function createOwnerAuthUser() {
    const { data, error } = await supabase.auth.admin.createUser({
      email:          ownerEmailArg,
      email_confirm:  true,
      user_metadata:  { name: ownerNameArg },
      app_metadata:   { tenant_id: tenant.id, intended_actor: 'staff' },
    })

    if (error != null || data?.user == null) {
      throw new Error(`createUser failed: ${error?.message ?? 'no user returned'}`)
    }

    return toAuthUserSummary(data.user)
  }

  // ─── Step 6: Generate invite/recovery link ────────────────────────────────
  // The user exists; generate a recovery (password-set) link so they can sign in.
  // generateLink does not send email; handle the link as a sensitive credential.
  const { data: link, error: lErr } = await supabase.auth.admin.generateLink({
    type:  'recovery',
    email: ownerEmailArg,
  })

  if (lErr != null) {
    throw new Error(`generateLink failed: ${lErr.message}`)
  }
  if (!link?.properties?.action_link) {
    throw new Error('generateLink failed: no action link returned')
  }
  console.log(`  Recovery link generated for ${ownerEmailArg}`)
  console.log('  Recovery link value intentionally not printed; use an approved secure handoff path for owner setup.')

  const {
    company,
    contact,
    customerUser,
    customerAuthUser,
    employee,
    workstation,
    job,
  } = await ensureSmokeData()

  console.log('')
  console.log('Bootstrap complete.')
  console.log(`  Tenant:    ${tenantNameArg} (${tenant.id})`)
  console.log(`  Staff row: ${staffRow.id} (${ownerEmailArg})`)
  console.log(`  Auth user: ${authUserId}`)
  console.log(`  Company:   ${company.id} (${company.name})`)
  console.log(`  Contact:   ${contact.id} (${contact.email ?? 'no email'})`)
  console.log(`  Customer:  ${customerUser.id} (${customerUser.email})`)
  console.log(`  Customer auth user: ${customerAuthUser.id}`)
  console.log(`  Employee:  ${employee.id} (${employee.display_name}; smoke PIN 1234)`)
  console.log(`  Station:   ${workstation.id} (${workstation.name})`)
  console.log(`  Job:       ${job.id} (${job.job_number})`)
  console.log(`  Packet QR: https://${APP_HOST}/scan?packet=${job.packet_token}`)
  console.log('')
  console.log('Next steps:')
  console.log('  1. Complete owner password setup through an approved secure handoff path.')
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
      .select('id, email, auth_user_id, company_id, contact_id, is_active')
      .single()

    if (customerErr != null || customerUser == null) {
      throw new Error(`customer_users verification failed: ${customerErr?.message ?? 'no data returned'}`)
    }

    const customerAuthUser = await ensureSmokeCustomerAuthUser(customerUser.id, customerUser.email)

    const { data: existingEmployee, error: employeeLookupErr } = await supabase
      .from('shop_employees')
      .select('id, display_name, is_active')
      .eq('tenant_id', tenant.id)
      .eq('display_name', SMOKE_EMPLOYEE_NAME)
      .maybeSingle()

    if (employeeLookupErr != null) {
      throw new Error(`shop_employees lookup failed: ${employeeLookupErr.message}`)
    }

    const employee = existingEmployee == null
      ? await createSmokeEmployee()
      : await verifySmokeEmployee(existingEmployee.id)

    async function createSmokeEmployee() {
      const { data, error } = await supabase
        .from('shop_employees')
        .insert({
          tenant_id: tenant.id,
          display_name: SMOKE_EMPLOYEE_NAME,
          pin_hash: SMOKE_PIN_HASH,
          is_active: true,
        })
        .select('id, display_name, is_active')
        .single()

      if (error != null || data == null) {
        throw new Error(`shop_employees INSERT failed: ${error?.message ?? 'no data returned'}`)
      }

      return data
    }

    async function verifySmokeEmployee(employeeId: string) {
      const { data, error } = await supabase
        .from('shop_employees')
        .update({
          pin_hash: SMOKE_PIN_HASH,
          is_active: true,
        })
        .eq('id', employeeId)
        .select('id, display_name, is_active')
        .single()

      if (error != null || data == null) {
        throw new Error(`shop_employees verification failed: ${error?.message ?? 'no data returned'}`)
      }

      return data
    }

    const { data: existingWorkstation, error: workstationLookupErr } = await supabase
      .from('workstations')
      .select('id, auth_user_id, device_token, name')
      .eq('tenant_id', tenant.id)
      .eq('name', SMOKE_WORKSTATION_NAME)
      .maybeSingle()

    if (workstationLookupErr != null) {
      throw new Error(`workstations lookup failed: ${workstationLookupErr.message}`)
    }

    const workstation = await ensureSmokeWorkstation(existingWorkstation)

    async function ensureSmokeWorkstation(existingWorkstationRow: ExistingWorkstation | null) {
      const workstationEmail = `workstation-${slugArg}-smoke@workstations.${slugArg}.local`
      const deviceToken = existingWorkstationRow?.device_token ?? randomBytes(36).toString('base64url')
      const existingWorkstationAuthUser = await findAuthUserByEmail(workstationEmail)
      const workstationAuthUser = existingWorkstationAuthUser
        ?? await createSmokeWorkstationAuthUser(workstationEmail, deviceToken)

      if (existingWorkstationAuthUser != null) {
        await updateWorkstationAuthUser(existingWorkstationAuthUser, deviceToken, existingWorkstationRow?.id)
      }

      if (existingWorkstationRow == null) {
        const { data, error } = await supabase
          .from('workstations')
          .insert({
            tenant_id: tenant.id,
            auth_user_id: workstationAuthUser.id,
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

        await updateWorkstationAuthUser(workstationAuthUser, deviceToken, data.id)
        return data
      }

      const { data, error } = await supabase
        .from('workstations')
        .update({
          auth_user_id: workstationAuthUser.id,
          default_stage: 'received',
          physical_location: 'Smoke test bench',
          is_active: true,
        })
        .eq('id', existingWorkstationRow.id)
        .select('id, name')
        .single()

      if (error != null || data == null) {
        throw new Error(`workstations verification failed: ${error?.message ?? 'no data returned'}`)
      }

      return data
    }

    async function createSmokeWorkstationAuthUser(email: string, deviceToken: string) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: deviceToken,
        email_confirm: true,
        app_metadata: {
          tenant_id: tenant.id,
          audience: 'staff_shop',
          role: 'shop',
          intended_actor: 'workstation',
        },
      })

      if (error != null || data?.user == null) {
        throw new Error(`workstation auth user failed: ${error?.message ?? 'no user returned'}`)
      }

      return toAuthUserSummary(data.user)
    }

    async function updateWorkstationAuthUser(
      authUser: AuthUserSummary,
      deviceToken: string,
      workstationId: string | undefined
    ) {
      const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
        password: deviceToken,
        app_metadata: {
          ...authUser.appMetadata,
          tenant_id: tenant.id,
          audience: 'staff_shop',
          role: 'shop',
          intended_actor: 'workstation',
          ...(workstationId == null ? {} : { workstation_id: workstationId }),
        },
      })

      if (error != null) {
        throw new Error(`workstation auth user recovery failed: ${error.message}`)
      }
    }

    const packetToken = randomBytes(12).toString('base64url').slice(0, 16)
    const { data: existingJob, error: jobLookupErr } = await supabase
      .from('jobs')
      .select('id, job_number, packet_token, company_id, contact_id')
      .eq('tenant_id', tenant.id)
      .eq('job_name', SMOKE_JOB_NAME)
      .maybeSingle()

    if (jobLookupErr != null) {
      throw new Error(`jobs lookup failed: ${jobLookupErr.message}`)
    }

    const job = existingJob == null
      ? await createSmokeJob(packetToken, company.id, contact.id)
      : await verifySmokeJob(existingJob, company.id, contact.id)

    return { company, contact, customerUser, customerAuthUser, employee, workstation, job }
  }

  async function ensureSmokeCustomerAuthUser(customerUserId: string, email: string) {
    const existingCustomerAuthUser = await findAuthUserByEmail(email)
    const customerAuthUser = existingCustomerAuthUser ?? await createSmokeCustomerAuthUser(email)

    if (existingCustomerAuthUser != null) {
      await ensureAuthUserAppMetadata(existingCustomerAuthUser, {
        tenant_id: tenant.id,
        audience: 'customer',
        role: 'customer',
        intended_actor: 'customer',
      }, 'customer auth user')
    }

    const { data: linkedCustomerUser, error: linkErr } = await supabase
      .from('customer_users')
      .update({ auth_user_id: customerAuthUser.id })
      .eq('id', customerUserId)
      .select('id, auth_user_id')
      .single()

    if (linkErr != null || linkedCustomerUser?.auth_user_id !== customerAuthUser.id) {
      throw new Error(`customer_users auth_user_id verification failed: ${linkErr?.message ?? 'link mismatch'}`)
    }

    return customerAuthUser
  }

  async function createSmokeCustomerAuthUser(email: string) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name: 'Smoke Customer' },
      app_metadata: {
        tenant_id: tenant.id,
        audience: 'customer',
        role: 'customer',
        intended_actor: 'customer',
      },
    })

    if (error != null || data?.user == null) {
      throw new Error(`customer auth user failed: ${error?.message ?? 'no user returned'}`)
    }

    return toAuthUserSummary(data.user)
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
        created_by_staff_id: staffRow.id,
      })
      .select('id, job_number, packet_token')
      .single()

    if (error != null || data == null) {
      throw new Error(`jobs INSERT failed: ${error?.message ?? 'no data returned'}`)
    }

    return data
  }

  async function verifySmokeJob(existingJob: ExistingSeedJob, companyId: string, contactId: string) {
    if (!/^[A-Za-z0-9_-]{16}$/.test(existingJob.packet_token)) {
      throw new Error(`jobs verification failed: seed job ${existingJob.id} has an invalid packet_token`)
    }

    if (existingJob.company_id === companyId && existingJob.contact_id === contactId) {
      return existingJob
    }

    const { data, error } = await supabase
      .from('jobs')
      .update({
        company_id: companyId,
        contact_id: contactId,
        part_count: 1,
        parts_received_count: 1,
        priority: 'normal',
        intake_status: 'scheduled',
        created_by_staff_id: staffRow.id,
      })
      .eq('id', existingJob.id)
      .select('id, job_number, packet_token')
      .single()

    if (error != null || data == null) {
      throw new Error(`jobs verification failed: ${error?.message ?? 'no data returned'}`)
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

  async function ensureAuthUserAppMetadata(
    authUser: AuthUserSummary,
    metadata: Record<string, unknown>,
    label: string
  ) {
    const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
      app_metadata: {
        ...authUser.appMetadata,
        ...metadata,
      },
    })

    if (error != null) {
      throw new Error(`${label} metadata verification failed: ${error.message}`)
    }
  }

  async function findAuthUserByEmail(email: string): Promise<AuthUserSummary | null> {
    const perPage = 1000
    const normalizedEmail = email.toLowerCase()

    for (let page = 1; ; page += 1) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
      if (error != null) {
        throw new Error(`listUsers failed: ${error.message}`)
      }

      const match = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail)
      if (match != null) {
        return toAuthUserSummary(match)
      }

      const reachedKnownLastPage = data.lastPage > 0 && page >= data.lastPage
      const reachedShortPage = data.users.length < perPage
      if (reachedKnownLastPage || reachedShortPage) {
        return null
      }
    }
  }
}

function toAuthUserSummary(user: User): AuthUserSummary {
  return {
    id: user.id,
    email: user.email ?? undefined,
    appMetadata: toRecord(user.app_metadata),
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

main().catch((err: unknown) => {
  console.error('seed-tenant failed:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
