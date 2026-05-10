import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createWorkstation } from './workstation'

// Mock dependencies
vi.mock('@/shared/db/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/shared/db/admin', () => ({
  createServiceClient: vi.fn(),
}))

vi.mock('@/shared/auth-helpers/require', () => ({
  requireOfficeStaff: vi.fn(),
}))

vi.mock('@/shared/auth-helpers/claims', () => ({
  getCurrentClaims: vi.fn(),
}))

import { createClient } from '@/shared/db/server'
import { createServiceClient } from '@/shared/db/admin'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'

const TENANT_ID = 'tenant-uuid-1234'
const WS_UUID = 'ws-uuid-5678'
const AUTH_USER_UUID = 'auth-user-uuid-9012'

const mockSelect = vi.fn()
const mockSingle = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()

const mockCreateUser = vi.fn()
const mockAdminSupabase = {
  auth: {
    admin: {
      createUser: mockCreateUser,
    },
  },
}

const mockSupabaseFrom = vi.fn()
const mockSupabase = {
  from: mockSupabaseFrom,
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(requireOfficeStaff as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'staff-user-id' })
  ;(getCurrentClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
    tenant_id: TENANT_ID,
    audience: 'staff_office',
    role: 'admin',
  })
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase)
  ;(createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(mockAdminSupabase)

  // Default happy path: successful workstation insert
  mockSingle.mockResolvedValue({
    data: { id: WS_UUID, tenant_id: TENANT_ID, name: 'Station 1' },
    error: null,
  })
  mockSelect.mockReturnValue({ single: mockSingle })
  mockInsert.mockReturnValue({ select: mockSelect })

  // Default happy path: successful workstation link update
  mockEq.mockResolvedValue({ error: null })
  mockUpdate.mockReturnValue({ eq: mockEq })

  mockSupabaseFrom.mockReturnValue({
    insert: mockInsert,
    update: mockUpdate,
  })

  // Default happy path: successful auth user creation
  mockCreateUser.mockResolvedValue({
    data: { user: { id: AUTH_USER_UUID } },
    error: null,
  })
})

describe('createWorkstation', () => {
  it('happy path: inserts workstation, creates synthetic auth user, links auth_user_id, returns enrollment URL', async () => {
    const result = await createWorkstation({ name: 'Station 1' })

    // Step 1: workstation insert called
    expect(mockSupabaseFrom).toHaveBeenCalledWith('workstations')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: TENANT_ID,
        name: 'Station 1',
      })
    )

    // Step 2: auth user created with workstation_id from the start
    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: expect.stringContaining('@workstations.pops.local'),
        email_confirm: true,
        app_metadata: expect.objectContaining({
          tenant_id: TENANT_ID,
          audience: 'staff_shop',
          workstation_id: WS_UUID,
          role: 'shop',
        }),
      })
    )

    // Step 3: auth_user_id linked back
    expect(mockUpdate).toHaveBeenCalledWith({ auth_user_id: AUTH_USER_UUID })
    expect(mockEq).toHaveBeenCalledWith('id', WS_UUID)

    // Returns enrollment URL
    expect(result).toMatchObject({
      workstation: expect.objectContaining({ id: WS_UUID }),
      enrollment_url: expect.stringContaining('/scan/enroll?token='),
    })
  })

  it('throws with "Workstation insert failed" message when workstation insert errors', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'DB constraint violation' },
    })

    await expect(createWorkstation({ name: 'Station 1' })).rejects.toThrow('Workstation insert failed')
    // Auth user creation should NOT be called
    expect(mockCreateUser).not.toHaveBeenCalled()
  })

  it('throws with "Auth user creation failed" message when auth.admin.createUser errors', async () => {
    mockCreateUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Email already registered' },
    })

    await expect(createWorkstation({ name: 'Station 1' })).rejects.toThrow('Auth user creation failed')
    // Link step should NOT execute
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('throws when requireOfficeStaff rejects (access denied)', async () => {
    ;(requireOfficeStaff as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Access denied: office staff only')
    )

    await expect(createWorkstation({ name: 'Station 1' })).rejects.toThrow('Access denied')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('synthetic email format matches workstation-{uuid}@workstations.pops.local', async () => {
    await createWorkstation({ name: 'Station 1' })

    const createUserCall = mockCreateUser.mock.calls[0]?.[0] as { email: string } | undefined
    expect(createUserCall?.email).toMatch(/^workstation-[0-9a-f-]{36}@workstations\.pops\.local$/)
  })

  it('device_token is exactly 48 chars and URL-safe (no +/= characters)', async () => {
    await createWorkstation({ name: 'Station 1' })

    const insertCall = mockInsert.mock.calls[0]?.[0] as { device_token: string } | undefined
    const token = insertCall?.device_token
    expect(token).toBeDefined()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- defined by expect above
    expect(token!.length).toBe(48)
    // URL-safe base64: only [A-Za-z0-9_-] allowed (no + / =)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- defined by expect above
    expect(token!).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('throws "Invalid input" for invalid input schema', async () => {
    await expect(createWorkstation({ name: '' })).rejects.toThrow('Invalid input')
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
