import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createContact, updateContact, archiveContact } from './contacts'

vi.mock('@/shared/db/server', () => ({ createClient: vi.fn() }))
vi.mock('@/shared/auth-helpers/require', () => ({ requireOfficeStaff: vi.fn() }))
vi.mock('@/shared/auth-helpers/claims', () => ({ getCurrentClaims: vi.fn() }))
vi.mock('@/shared/audit', () => ({ logAuditEvent: vi.fn().mockResolvedValue(undefined) }))

import { createClient } from '@/shared/db/server'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'
import { logAuditEvent } from '@/shared/audit'

const TENANT_ID = '11111111-1111-4111-8111-111111111111'
const COMPANY_ID = '22222222-2222-4222-8222-222222222222'
const CONTACT_ID = '33333333-3333-4333-8333-333333333333'

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

  mockSingle.mockResolvedValue({
    data: { id: CONTACT_ID, tenant_id: TENANT_ID, company_id: COMPANY_ID, first_name: 'Pat' },
    error: null,
  })
  mockFrom.mockReturnValue({ insert: mockInsert, update: mockUpdate })
})

describe('createContact', () => {
  it('inserts with tenant_id from claims and is_primary defaulting to false', async () => {
    await createContact({ company_id: COMPANY_ID, first_name: 'Pat' })

    expect(mockFrom).toHaveBeenCalledWith('contacts')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: TENANT_ID,
        company_id: COMPANY_ID,
        first_name: 'Pat',
        is_primary: false,
      })
    )
    expect(logAuditEvent).toHaveBeenCalledWith({
      action: 'create',
      entity_type: 'contact',
      entity_id: CONTACT_ID,
    })
  })

  it('passes is_primary=true through when set', async () => {
    await createContact({ company_id: COMPANY_ID, first_name: 'Pat', is_primary: true })
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ is_primary: true }))
  })

  it('rejects when company_id is not a UUID', async () => {
    await expect(createContact({ company_id: 'no', first_name: 'Pat' })).rejects.toThrow('Invalid input')
  })

  it('rejects when first_name empty', async () => {
    await expect(createContact({ company_id: COMPANY_ID, first_name: '' })).rejects.toThrow('Invalid input')
  })

  it('rejects when email is invalid', async () => {
    await expect(
      createContact({ company_id: COMPANY_ID, first_name: 'Pat', email: 'not-email' })
    ).rejects.toThrow('Invalid input')
  })

  it('surfaces DB error (e.g. one_primary_per_company unique violation)', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'duplicate key value violates unique constraint "one_primary_per_company"' },
    })
    await expect(
      createContact({ company_id: COMPANY_ID, first_name: 'Pat', is_primary: true })
    ).rejects.toThrow('Contact insert failed: duplicate key value violates unique constraint "one_primary_per_company"')
  })
})

describe('updateContact', () => {
  beforeEach(() => {
    mockFrom.mockReturnValue({ update: mockUpdate })
  })

  it('updates only provided fields', async () => {
    await updateContact({ id: CONTACT_ID, first_name: 'Patricia' })
    expect(mockUpdate).toHaveBeenCalledWith({ first_name: 'Patricia' })
    expect(mockEqUpdate).toHaveBeenCalledWith('id', CONTACT_ID)
  })

  it('rejects invalid id', async () => {
    await expect(updateContact({ id: 'no', first_name: 'X' })).rejects.toThrow('Invalid input')
  })
})

describe('archiveContact', () => {
  beforeEach(() => {
    mockFrom.mockReturnValue({ update: mockArchiveUpdate })
  })

  it('sets archived_at and audits', async () => {
    const result = await archiveContact({ id: CONTACT_ID })
    expect(mockArchiveUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ archived_at: expect.any(String) })
    )
    expect(result).toEqual({ id: CONTACT_ID })
  })

  it('throws on DB error', async () => {
    mockEqOnly.mockResolvedValueOnce({ error: { message: 'rls denied' } })
    await expect(archiveContact({ id: CONTACT_ID })).rejects.toThrow('Contact archive failed')
  })
})
