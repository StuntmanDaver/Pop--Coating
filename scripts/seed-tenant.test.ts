import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(path.join(process.cwd(), 'scripts/seed-tenant.ts'), 'utf8')

describe('seed-tenant script contract', () => {
  it('covers the P1-GATE-02 Pops smoke records', () => {
    const requiredTables = [
      'tenants',
      'tenant_domains',
      'shop_settings',
      'staff',
      'companies',
      'contacts',
      'customer_users',
      'shop_employees',
      'workstations',
      'jobs',
    ]

    for (const table of requiredTables) {
      expect(source).toContain(`.from('${table}')`)
    }

    expect(source).toContain("const SMOKE_COMPANY_NAME = 'Pops Smoke Test Customer'")
    expect(source).toContain("const SMOKE_CONTACT_EMAIL = 'smoke.customer@example.com'")
    expect(source).toContain("const SMOKE_EMPLOYEE_NAME = 'Smoke Floor Worker'")
    expect(source).toContain("const SMOKE_WORKSTATION_NAME = 'Smoke Workstation'")
    expect(source).toContain("const SMOKE_JOB_NAME = 'Smoke Test Packet Job'")
  })

  it('keeps the generated packet QR on the canonical staff scanner host', () => {
    expect(source).toContain("const APP_HOST = 'app.popsindustrial.com'")
    expect(source).toContain(
      'console.log(`  Packet QR: https://${APP_HOST}/scan?packet=${job.packet_token}`)'
    )
    expect(source).toContain("const PORTAL_HOST = 'track.popsindustrial.com'")
    expect(source).not.toContain('track.popsindustrial.com/scan?packet=')
  })

  it('uses idempotent upserts, lookups, and auth-user recovery paths', () => {
    expect(source).toContain("upsert({ tenant_id: tenant.id }, { onConflict: 'tenant_id' })")
    expect(source).toContain("{ onConflict: 'host' }")
    expect(source).toContain("{ onConflict: 'tenant_id,email' }")
    expect(source).toContain(".eq('name', SMOKE_COMPANY_NAME)")
    expect(source).toContain(".eq('email', SMOKE_CONTACT_EMAIL)")
    expect(source).toContain(".eq('display_name', SMOKE_EMPLOYEE_NAME)")
    expect(source).toContain(".eq('name', SMOKE_WORKSTATION_NAME)")
    expect(source).toContain(".eq('job_name', SMOKE_JOB_NAME)")
    expect(source).toContain('findAuthUserByEmail')
    expect(source).toContain('listUsers({ page, perPage })')
    expect(source).toContain('updateUserById(')
  })

  it('does not print generated setup-link secrets', () => {
    expect(source).toContain('generateLink')
    expect(source).toContain('link value intentionally not printed')
    expect(source).not.toContain('print-recovery-link')
    expect(source).not.toMatch(/console\.(?:log|warn|error)\([^)]*action_link/i)
    expect(source).not.toMatch(/console\.(?:log|warn|error)\([^)]*action link/i)
  })
})
