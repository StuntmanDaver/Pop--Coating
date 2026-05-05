import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logActivity } from './activities'

vi.mock('@/shared/db/server', () => ({ createClient: vi.fn() }))
vi.mock('@/shared/auth-helpers/require', () => ({ requireOfficeStaff: vi.fn() }))
vi.mock('@/shared/auth-helpers/claims', () => ({ getCurrentClaims: vi.fn() }))
vi.mock('@/shared/audit', () => ({ logAuditEvent: vi.fn().mockResolvedValue(undefined) }))

import { createClient } from '@/shared/db/server'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'

const TENANT_ID = '11111111-1111-4111-8111-111111111111'
const COMPANY_ID = '22222222-2222-4222-8222-222222222222'
const STAFF_ID = '44444444-4444-4444-8444-444444444444'
const ACTIVITY_ID = '55555555-5555-4555-8555-555555555555'

const mockSingle = vi.fn()
const mockSelect = vi.fn(() => ({ single: mockSingle }))
const mockInsert = vi.fn(() => ({ select: mockSelect }))
const mockFrom = vi.fn(() => ({ insert: mockInsert }))

beforeEach(() => {
  vi.clearAllMocks()
  ;(requireOfficeStaff as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'user-1' })
  ;(getCurrentClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
    tenant_id: TENANT_ID,
    audience: 'staff_office',
    role: 'admin',
    staff_id: STAFF_ID,
  })
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: mockFrom })

  mockSingle.mockResolvedValue({
    data: { id: ACTIVITY_ID, tenant_id: TENANT_ID, entity_type: 'company', entity_id: COMPANY_ID },
    error: null,
  })
})

describe('logActivity', () => {
  it('inserts with claims-derived tenant_id and staff_id and defaults occurred_at to now', async () => {
    await logActivity({
      entity_type: 'company',
      entity_id: COMPANY_ID,
      activity_type: 'call',
      subject: 'Discussed quote revision',
    })

    expect(mockFrom).toHaveBeenCalledWith('activities')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: TENANT_ID,
        entity_type: 'company',
        entity_id: COMPANY_ID,
        activity_type: 'call',
        subject: 'Discussed quote revision',
        customer_visible: false,
        staff_id: STAFF_ID,
        occurred_at: expect.any(String),
      })
    )
  })

  it('passes through customer_visible=true and explicit occurred_at', async () => {
    const when = '2026-04-01T12:00:00.000Z'
    await logActivity({
      entity_type: 'job',
      entity_id: COMPANY_ID,
      activity_type: 'note',
      subject: 'Photo uploaded',
      customer_visible: true,
      occurred_at: when,
    })
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ customer_visible: true, occurred_at: when })
    )
  })

  it('rejects invalid entity_type', async () => {
    await expect(
      logActivity({ entity_type: 'inventory_item', entity_id: COMPANY_ID, activity_type: 'note', subject: 'x' })
    ).rejects.toThrow('Invalid input')
  })

  it('rejects invalid activity_type', async () => {
    await expect(
      logActivity({ entity_type: 'company', entity_id: COMPANY_ID, activity_type: 'video', subject: 'x' })
    ).rejects.toThrow('Invalid input')
  })

  it('rejects empty subject', async () => {
    await expect(
      logActivity({ entity_type: 'company', entity_id: COMPANY_ID, activity_type: 'call', subject: '' })
    ).rejects.toThrow('Invalid input')
  })

  it('handles missing staff_id (synthetic-user paths) by inserting null', async () => {
    ;(getCurrentClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
      tenant_id: TENANT_ID,
      audience: 'staff_office',
      role: 'admin',
    })
    await logActivity({
      entity_type: 'company',
      entity_id: COMPANY_ID,
      activity_type: 'note',
      subject: 'auto-logged',
    })
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ staff_id: null }))
  })
})
