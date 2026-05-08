import { beforeEach, describe, expect, it, vi } from 'vitest'
import { logAuditEvent } from './index'

vi.mock('next/headers', () => ({ headers: vi.fn() }))
vi.mock('@/shared/auth-helpers/claims', () => ({ getCurrentClaims: vi.fn() }))
vi.mock('@/shared/db/admin', () => ({ createServiceClient: vi.fn() }))

import { headers } from 'next/headers'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'
import { createServiceClient } from '@/shared/db/admin'

const TENANT_ID = '11111111-1111-4111-8111-111111111111'
const STAFF_ID = '22222222-2222-4222-8222-222222222222'
const CUSTOMER_USER_ID = '33333333-3333-4333-8333-333333333333'
const ENTITY_ID = '44444444-4444-4444-8444-444444444444'

const mockInsert = vi.fn()
const mockFrom = vi.fn(() => ({ insert: mockInsert }))

beforeEach(() => {
  vi.clearAllMocks()

  ;(createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue({
    from: mockFrom,
  })
  ;(headers as ReturnType<typeof vi.fn>).mockResolvedValue({
    get(name: string) {
      const values: Record<string, string> = {
        'x-forwarded-for': '203.0.113.4, 10.0.0.1',
        'user-agent': 'Vitest Browser',
      }
      return values[name] ?? null
    },
  })
  mockInsert.mockResolvedValue({ error: null })
})

describe('logAuditEvent', () => {
  it('writes staff audit rows through the service-role client', async () => {
    ;(getCurrentClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
      tenant_id: TENANT_ID,
      audience: 'staff_office',
      role: 'admin',
      staff_id: STAFF_ID,
    })

    await logAuditEvent({
      action: 'update',
      entity_type: 'company',
      entity_id: ENTITY_ID,
      changed_fields: { name: 'Acme', nested: { active: true, ignored: undefined }, ignored: undefined },
    })

    expect(mockFrom).toHaveBeenCalledWith('audit_log')
    expect(mockInsert).toHaveBeenCalledWith({
      tenant_id: TENANT_ID,
      entity_type: 'company',
      entity_id: ENTITY_ID,
      action: 'update',
      changed_fields: { name: 'Acme', nested: { active: true } },
      actor_type: 'staff',
      actor_id: STAFF_ID,
      ip_address: '203.0.113.4',
      user_agent: 'Vitest Browser',
    })
  })

  it('maps customer claims to a customer actor', async () => {
    ;(getCurrentClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
      tenant_id: TENANT_ID,
      audience: 'customer',
      role: 'viewer',
      customer_user_id: CUSTOMER_USER_ID,
    })

    await logAuditEvent({
      action: 'magic_link_request',
      entity_type: 'customer_user',
      entity_id: CUSTOMER_USER_ID,
    })

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_type: 'customer',
        actor_id: CUSTOMER_USER_ID,
      })
    )
  })

  it('supports explicit system audit rows without reading user claims', async () => {
    await logAuditEvent({
      tenant_id: TENANT_ID,
      actor_type: 'system',
      action: 'export',
      entity_type: 'job',
      entity_id: ENTITY_ID,
    })

    expect(getCurrentClaims).not.toHaveBeenCalled()
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: TENANT_ID,
        actor_type: 'system',
        actor_id: null,
      })
    )
  })

  it('requires a tenant_id for explicit system audit rows', async () => {
    await expect(
      logAuditEvent({
        actor_type: 'system',
        action: 'export',
        entity_type: 'job',
        entity_id: ENTITY_ID,
      })
    ).rejects.toThrow('Audit log requires tenant_id')
  })

  it('throws when the audit row cannot be inserted', async () => {
    ;(getCurrentClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
      tenant_id: TENANT_ID,
      audience: 'staff_office',
      role: 'admin',
      staff_id: STAFF_ID,
    })
    mockInsert.mockResolvedValueOnce({ error: { message: 'permission denied' } })

    await expect(
      logAuditEvent({ action: 'create', entity_type: 'company', entity_id: ENTITY_ID })
    ).rejects.toThrow('Audit log insert failed: permission denied')
  })
})
