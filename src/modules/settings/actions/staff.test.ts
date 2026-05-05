import { describe, it, expect, vi, beforeEach } from 'vitest'
import { inviteStaff, updateStaff, deactivateStaff } from './staff'

vi.mock('@/shared/db/server', () => ({ createClient: vi.fn() }))
vi.mock('@/shared/db/admin', () => ({ createServiceClient: vi.fn() }))
vi.mock('@/shared/auth-helpers/require', () => ({ requireOfficeStaff: vi.fn() }))
vi.mock('@/shared/auth-helpers/claims', () => ({ getCurrentClaims: vi.fn() }))
vi.mock('@/shared/audit', () => ({ logAuditEvent: vi.fn().mockResolvedValue(undefined) }))

import { createClient } from '@/shared/db/server'
import { createServiceClient } from '@/shared/db/admin'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'

const TENANT_ID = '11111111-1111-4111-8111-111111111111'
const STAFF_ID = '44444444-4444-4444-8444-444444444444'
const AUTH_USER_ID = '55555555-5555-4555-8555-555555555555'

// staff.from('staff').insert(...).select(...).single()
const mockSingle = vi.fn()
const mockSelect = vi.fn(() => ({ single: mockSingle }))
const mockInsert = vi.fn(() => ({ select: mockSelect }))
// staff.from('staff').delete().eq() — used for rollback
type ErrResult = { error: { message: string } | null }
const mockDeleteEq = vi.fn<() => Promise<ErrResult>>(() => Promise.resolve({ error: null }))
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }))
// staff.from('staff').update(...).eq()
const mockUpdateEq = vi.fn<() => Promise<ErrResult>>(() => Promise.resolve({ error: null }))
const mockUpdate = vi.fn((_data: unknown) => ({ eq: mockUpdateEq }))
const mockFrom = vi.fn(() => ({ insert: mockInsert, delete: mockDelete, update: mockUpdate }))

// Service-role admin
const mockCreateUser = vi.fn()
const mockGenerateLink = vi.fn()
const mockAdminClient = {
  auth: {
    admin: {
      createUser: mockCreateUser,
      generateLink: mockGenerateLink,
    },
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(requireOfficeStaff as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'u1' })
  ;(getCurrentClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
    tenant_id: TENANT_ID,
    audience: 'staff_office',
    role: 'admin',
  })
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: mockFrom })
  ;(createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(mockAdminClient)

  mockSingle.mockResolvedValue({
    data: { id: STAFF_ID, tenant_id: TENANT_ID, email: 'p@acme.test', role: 'office' },
    error: null,
  })
  mockCreateUser.mockResolvedValue({
    data: { user: { id: AUTH_USER_ID } },
    error: null,
  })
  mockGenerateLink.mockResolvedValue({
    data: { properties: { action_link: 'https://acme.test/auth/invite?token=x' } },
    error: null,
  })
})

describe('inviteStaff', () => {
  it('inserts staff row, creates auth user with app_metadata BAKED IN, then dispatches invite link', async () => {
    const result = await inviteStaff({
      email: 'p@acme.test',
      name: 'Pat',
      role: 'office',
    })

    // Step 1: staff insert with claims.tenant_id
    expect(mockFrom).toHaveBeenCalledWith('staff')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: TENANT_ID,
        email: 'p@acme.test',
        name: 'Pat',
        role: 'office',
      })
    )

    // Step 2: createUser with app_metadata.tenant_id + intended_actor — the bug-fix.
    expect(mockCreateUser).toHaveBeenCalledWith({
      email: 'p@acme.test',
      email_confirm: true,
      user_metadata: { name: 'Pat' },
      app_metadata: {
        tenant_id: TENANT_ID,
        intended_actor: 'staff',
      },
    })

    // Step 3: generateLink dispatch
    expect(mockGenerateLink).toHaveBeenCalledWith({
      type: 'invite',
      email: 'p@acme.test',
    })

    expect(result).toEqual({
      staff: { id: STAFF_ID, tenant_id: TENANT_ID, email: 'p@acme.test', role: 'office' },
      auth_user_id: AUTH_USER_ID,
      invite_link: 'https://acme.test/auth/invite?token=x',
    })
  })

  it('rolls back staff row when createUser fails (avoids orphaned record)', async () => {
    mockCreateUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'email already exists' },
    })

    await expect(
      inviteStaff({ email: 'p@acme.test', name: 'Pat', role: 'office' })
    ).rejects.toThrow('Auth user creation failed: email already exists')

    // Rollback: delete on staff.id
    expect(mockDelete).toHaveBeenCalled()
    expect(mockDeleteEq).toHaveBeenCalledWith('id', STAFF_ID)
    expect(mockGenerateLink).not.toHaveBeenCalled()
  })

  it('does NOT roll back staff or auth user when generateLink fails (auth user already exists)', async () => {
    mockGenerateLink.mockResolvedValueOnce({
      data: null,
      error: { message: 'smtp send failed' },
    })

    await expect(
      inviteStaff({ email: 'p@acme.test', name: 'Pat', role: 'office' })
    ).rejects.toThrow('Invite link dispatch failed: smtp send failed')

    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('rejects bad email', async () => {
    await expect(inviteStaff({ email: 'no', name: 'Pat', role: 'office' })).rejects.toThrow(
      'Invalid input'
    )
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('rejects unknown role', async () => {
    await expect(
      inviteStaff({ email: 'p@acme.test', name: 'Pat', role: 'tenant_admin' })
    ).rejects.toThrow('Invalid input')
  })

  it('surfaces UNIQUE(tenant_id,email) violation from staff insert', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'duplicate key value violates unique constraint "staff_tenant_id_email_key"' },
    })
    await expect(
      inviteStaff({ email: 'p@acme.test', name: 'Pat', role: 'office' })
    ).rejects.toThrow('Staff insert failed: duplicate key')
    // Should not reach createUser if insert fails
    expect(mockCreateUser).not.toHaveBeenCalled()
  })
})

describe('updateStaff', () => {
  it('updates only provided fields and audits', async () => {
    await updateStaff({ id: STAFF_ID, name: 'Patricia', role: 'manager' })
    expect(mockUpdate).toHaveBeenCalledWith({ name: 'Patricia', role: 'manager' })
    expect(mockUpdateEq).toHaveBeenCalledWith('id', STAFF_ID)
  })

  it('rejects bad uuid', async () => {
    await expect(updateStaff({ id: 'no', name: 'X' })).rejects.toThrow('Invalid input')
  })
})

describe('deactivateStaff', () => {
  it('sets is_active=false + archived_at', async () => {
    await deactivateStaff({ id: STAFF_ID })
    const arg = mockUpdate.mock.calls[0]?.[0] as { is_active: boolean; archived_at: string } | undefined
    expect(arg?.is_active).toBe(false)
    expect(arg?.archived_at).toEqual(expect.any(String))
  })
})
