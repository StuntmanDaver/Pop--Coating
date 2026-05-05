import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTag, deleteTag, applyTag, removeTag } from './tags'

vi.mock('@/shared/db/server', () => ({ createClient: vi.fn() }))
vi.mock('@/shared/auth-helpers/require', () => ({ requireOfficeStaff: vi.fn() }))
vi.mock('@/shared/auth-helpers/claims', () => ({ getCurrentClaims: vi.fn() }))
vi.mock('@/shared/audit', () => ({ logAuditEvent: vi.fn().mockResolvedValue(undefined) }))

import { createClient } from '@/shared/db/server'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'

const TENANT_ID = '11111111-1111-4111-8111-111111111111'
const TAG_ID = '66666666-6666-4666-8666-666666666666'
const ENTITY_ID = '77777777-7777-4777-8777-777777777777'

const mockSingle = vi.fn()
const mockSelect = vi.fn(() => ({ single: mockSingle }))
const mockInsert = vi.fn(() => ({ select: mockSelect }))
type ErrResult = { error: { message: string } | null }
const mockDeleteEq = vi.fn<() => Promise<ErrResult>>(() => Promise.resolve({ error: null }))
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }))
// applyTag uses upsert which returns Promise directly
const mockUpsert = vi.fn<(...args: unknown[]) => Promise<ErrResult>>(() => Promise.resolve({ error: null }))
// removeTag uses chained .eq().eq().eq() returning a promise
const mockRemoveEq3 = vi.fn<() => Promise<ErrResult>>(() => Promise.resolve({ error: null }))
const mockRemoveEq2 = vi.fn(() => ({ eq: mockRemoveEq3 }))
const mockRemoveEq1 = vi.fn(() => ({ eq: mockRemoveEq2 }))
const mockRemoveDelete = vi.fn(() => ({ eq: mockRemoveEq1 }))

const mockFrom = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  ;(requireOfficeStaff as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'u1' })
  ;(getCurrentClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
    tenant_id: TENANT_ID,
    audience: 'staff_office',
    role: 'admin',
  })
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: mockFrom })

  mockSingle.mockResolvedValue({
    data: { id: TAG_ID, tenant_id: TENANT_ID, name: 'Rush', color_hex: '#FF0000' },
    error: null,
  })
})

describe('createTag', () => {
  beforeEach(() => {
    mockFrom.mockReturnValue({ insert: mockInsert })
  })

  it('inserts with claims tenant_id', async () => {
    await createTag({ name: 'Rush', color_hex: '#FF0000' })
    expect(mockFrom).toHaveBeenCalledWith('tags')
    expect(mockInsert).toHaveBeenCalledWith({
      tenant_id: TENANT_ID,
      name: 'Rush',
      color_hex: '#FF0000',
    })
  })

  it('rejects malformed color_hex', async () => {
    await expect(createTag({ name: 'X', color_hex: 'red' })).rejects.toThrow('Invalid input')
    await expect(createTag({ name: 'X', color_hex: '#fff' })).rejects.toThrow('Invalid input')
    await expect(createTag({ name: 'X', color_hex: '#GGGGGG' })).rejects.toThrow('Invalid input')
  })

  it('accepts both upper- and lower-case hex digits', async () => {
    await createTag({ name: 'A', color_hex: '#abc123' })
    expect(mockInsert).toHaveBeenCalled()
  })

  it('surfaces UNIQUE(tenant_id,name) violation', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'duplicate key value violates unique constraint "tags_tenant_id_name_key"' },
    })
    await expect(createTag({ name: 'Rush', color_hex: '#FF0000' })).rejects.toThrow(
      'Tag insert failed: duplicate key value violates'
    )
  })
})

describe('deleteTag', () => {
  beforeEach(() => {
    mockFrom.mockReturnValue({ delete: mockDelete })
  })

  it('deletes by id', async () => {
    const result = await deleteTag({ id: TAG_ID })
    expect(mockDelete).toHaveBeenCalled()
    expect(mockDeleteEq).toHaveBeenCalledWith('id', TAG_ID)
    expect(result).toEqual({ id: TAG_ID })
  })

  it('rejects bad id', async () => {
    await expect(deleteTag({ id: 'no' })).rejects.toThrow('Invalid input')
  })
})

describe('applyTag', () => {
  beforeEach(() => {
    mockFrom.mockReturnValue({ upsert: mockUpsert })
  })

  it('upserts with ignoreDuplicates so re-apply is idempotent', async () => {
    await applyTag({ tag_id: TAG_ID, entity_type: 'job', entity_id: ENTITY_ID })

    expect(mockFrom).toHaveBeenCalledWith('tagged_entities')
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        tenant_id: TENANT_ID,
        tag_id: TAG_ID,
        entity_type: 'job',
        entity_id: ENTITY_ID,
      },
      { onConflict: 'tag_id,entity_type,entity_id', ignoreDuplicates: true }
    )
  })

  it('rejects unknown entity_type', async () => {
    await expect(
      applyTag({ tag_id: TAG_ID, entity_type: 'invoice', entity_id: ENTITY_ID })
    ).rejects.toThrow('Invalid input')
  })
})

describe('removeTag', () => {
  beforeEach(() => {
    mockFrom.mockReturnValue({ delete: mockRemoveDelete })
  })

  it('deletes the join row by composite key', async () => {
    await removeTag({ tag_id: TAG_ID, entity_type: 'company', entity_id: ENTITY_ID })

    expect(mockRemoveEq1).toHaveBeenCalledWith('tag_id', TAG_ID)
    expect(mockRemoveEq2).toHaveBeenCalledWith('entity_type', 'company')
    expect(mockRemoveEq3).toHaveBeenCalledWith('entity_id', ENTITY_ID)
  })

  it('throws when DB errors', async () => {
    mockRemoveEq3.mockResolvedValueOnce({ error: { message: 'rls denied' } })
    await expect(
      removeTag({ tag_id: TAG_ID, entity_type: 'company', entity_id: ENTITY_ID })
    ).rejects.toThrow('Tag remove failed')
  })
})
