import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateShopSettings } from './shop-settings'

vi.mock('@/shared/db/server', () => ({ createClient: vi.fn() }))
vi.mock('@/shared/auth-helpers/require', () => ({ requireOfficeStaff: vi.fn() }))
vi.mock('@/shared/auth-helpers/claims', () => ({ getCurrentClaims: vi.fn() }))
vi.mock('@/shared/audit', () => ({ logAuditEvent: vi.fn().mockResolvedValue(undefined) }))

import { createClient } from '@/shared/db/server'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'

const TENANT_ID = '11111111-1111-4111-8111-111111111111'

const mockSingle = vi.fn()
const mockEqRead = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEqRead }))
type ErrResult = { error: { message: string } | null }
const mockEqUpdate = vi.fn<() => Promise<ErrResult>>(() => Promise.resolve({ error: null }))
const mockUpdate = vi.fn(() => ({ eq: mockEqUpdate }))
const mockFrom = vi.fn(() => ({ select: mockSelect, update: mockUpdate }))

beforeEach(() => {
  vi.clearAllMocks()
  ;(requireOfficeStaff as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'u1' })
  ;(getCurrentClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
    tenant_id: TENANT_ID,
    audience: 'staff_office',
    role: 'admin',
  })
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: mockFrom })
  mockSingle.mockResolvedValue({ data: { is_first_job_created: false }, error: null })
})

describe('updateShopSettings', () => {
  it('allows changing brand_color_hex when no jobs exist', async () => {
    await updateShopSettings({ brand_color_hex: '#FF0000' })
    expect(mockUpdate).toHaveBeenCalledWith({ brand_color_hex: '#FF0000' })
  })

  it('allows changing timezone when no jobs exist', async () => {
    await updateShopSettings({ timezone: 'America/Los_Angeles' })
    expect(mockUpdate).toHaveBeenCalledWith({ timezone: 'America/Los_Angeles' })
  })

  it('blocks changing timezone after first job exists', async () => {
    mockSingle.mockResolvedValueOnce({ data: { is_first_job_created: true }, error: null })
    await expect(updateShopSettings({ timezone: 'UTC' })).rejects.toThrow(
      'Cannot change timezone/currency/job_number_prefix'
    )
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('blocks changing currency after first job exists', async () => {
    mockSingle.mockResolvedValueOnce({ data: { is_first_job_created: true }, error: null })
    await expect(updateShopSettings({ currency: 'EUR' })).rejects.toThrow(
      'Cannot change timezone/currency/job_number_prefix'
    )
  })

  it('blocks changing job_number_prefix after first job exists', async () => {
    mockSingle.mockResolvedValueOnce({ data: { is_first_job_created: true }, error: null })
    await expect(updateShopSettings({ job_number_prefix: 'NEW' })).rejects.toThrow(
      'Cannot change timezone/currency/job_number_prefix'
    )
  })

  it('still allows changing brand_color_hex AFTER first job exists', async () => {
    mockSingle.mockResolvedValueOnce({ data: { is_first_job_created: true }, error: null })
    await updateShopSettings({ brand_color_hex: '#0000FF', default_due_days: 21 })
    expect(mockUpdate).toHaveBeenCalledWith({
      brand_color_hex: '#0000FF',
      default_due_days: 21,
    })
  })

  it('rejects malformed brand_color_hex', async () => {
    await expect(updateShopSettings({ brand_color_hex: 'red' })).rejects.toThrow('Invalid input')
  })

  it('rejects pin_mode outside enum', async () => {
    await expect(updateShopSettings({ pin_mode: 'always' })).rejects.toThrow('Invalid input')
  })
})
