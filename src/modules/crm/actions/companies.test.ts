import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCompany, updateCompany, archiveCompany } from './companies'

vi.mock('@/shared/db/server', () => ({ createClient: vi.fn() }))
vi.mock('@/shared/auth-helpers/require', () => ({ requireOfficeStaff: vi.fn() }))
vi.mock('@/shared/auth-helpers/claims', () => ({ getCurrentClaims: vi.fn() }))
vi.mock('@/shared/audit', () => ({ logAuditEvent: vi.fn().mockResolvedValue(undefined) }))

import { createClient } from '@/shared/db/server'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'
import { logAuditEvent } from '@/shared/audit'

// RFC 4122 v4 UUIDs (variant 8/9/a/b in pos 19, version 4 in pos 14) — required by z.string().uuid()
const TENANT_ID = '11111111-1111-4111-8111-111111111111'
const COMPANY_ID = '22222222-2222-4222-8222-222222222222'

const mockSingle = vi.fn()
const mockSelect = vi.fn(() => ({ single: mockSingle }))
const mockInsert = vi.fn(() => ({ select: mockSelect }))
const mockEqUpdate = vi.fn(() => ({ select: mockSelect }))
type EqResult = { error: { message: string } | null }
const mockEqOnly = vi.fn<() => Promise<EqResult>>(() => Promise.resolve({ error: null }))
const mockUpdate = vi.fn(() => ({ eq: mockEqUpdate }))
const mockArchiveUpdate = vi.fn(() => ({ eq: mockEqOnly }))
const mockFrom = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  ;(requireOfficeStaff as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'staff-1' })
  ;(getCurrentClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
    tenant_id: TENANT_ID,
    audience: 'staff_office',
    role: 'admin',
  })
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: mockFrom })

  mockSingle.mockResolvedValue({ data: { id: COMPANY_ID, tenant_id: TENANT_ID, name: 'Acme' }, error: null })
  mockFrom.mockReturnValue({ insert: mockInsert, update: mockUpdate })
})

describe('createCompany', () => {
  it('inserts with tenant_id from claims and logs audit', async () => {
    const result = await createCompany({ name: 'Acme', email: 'ops@acme.test' })

    expect(mockFrom).toHaveBeenCalledWith('companies')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: TENANT_ID, name: 'Acme', email: 'ops@acme.test' })
    )
    expect(logAuditEvent).toHaveBeenCalledWith({
      action: 'create',
      entity_type: 'company',
      entity_id: COMPANY_ID,
    })
    expect(result.id).toBe(COMPANY_ID)
  })

  it('rejects invalid input', async () => {
    await expect(createCompany({ name: '' })).rejects.toThrow('Invalid input')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('rejects invalid email', async () => {
    await expect(createCompany({ name: 'A', email: 'not-an-email' })).rejects.toThrow('Invalid input')
  })

  it('throws when DB insert errors', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'duplicate key' } })
    await expect(createCompany({ name: 'Acme' })).rejects.toThrow('Company insert failed')
  })

  it('rejects when requireOfficeStaff redirects (rejects)', async () => {
    ;(requireOfficeStaff as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('redirect'))
    await expect(createCompany({ name: 'Acme' })).rejects.toThrow('redirect')
    expect(mockInsert).not.toHaveBeenCalled()
  })
})

describe('updateCompany', () => {
  beforeEach(() => {
    mockFrom.mockReturnValue({ update: mockUpdate })
  })

  it('updates only provided fields and logs audit with changed_fields', async () => {
    await updateCompany({ id: COMPANY_ID, name: 'Acme Renamed', phone: '555-1234' })

    expect(mockUpdate).toHaveBeenCalledWith({ name: 'Acme Renamed', phone: '555-1234' })
    expect(mockEqUpdate).toHaveBeenCalledWith('id', COMPANY_ID)
    expect(logAuditEvent).toHaveBeenCalledWith({
      action: 'update',
      entity_type: 'company',
      entity_id: COMPANY_ID,
      changed_fields: { name: 'Acme Renamed', phone: '555-1234' },
    })
  })

  it('rejects when id is not a UUID', async () => {
    await expect(updateCompany({ id: 'not-uuid', name: 'X' })).rejects.toThrow('Invalid input')
  })

  it('throws when DB update errors', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
    await expect(updateCompany({ id: COMPANY_ID, name: 'X' })).rejects.toThrow('Company update failed')
  })
})

describe('archiveCompany', () => {
  beforeEach(() => {
    mockFrom.mockReturnValue({ update: mockArchiveUpdate })
  })

  it('sets archived_at to a timestamp and logs audit', async () => {
    const result = await archiveCompany({ id: COMPANY_ID })

    expect(mockArchiveUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ archived_at: expect.any(String) })
    )
    expect(mockEqOnly).toHaveBeenCalledWith('id', COMPANY_ID)
    expect(logAuditEvent).toHaveBeenCalledWith({
      action: 'archive',
      entity_type: 'company',
      entity_id: COMPANY_ID,
    })
    expect(result).toEqual({ id: COMPANY_ID })
  })

  it('rejects invalid id', async () => {
    await expect(archiveCompany({ id: 'no' })).rejects.toThrow('Invalid input')
  })

  it('throws when DB update errors', async () => {
    mockEqOnly.mockResolvedValueOnce({ error: { message: 'rls denied' } })
    await expect(archiveCompany({ id: COMPANY_ID })).rejects.toThrow('Company archive failed')
  })
})
