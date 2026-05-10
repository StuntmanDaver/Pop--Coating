import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getJobTimeline, getCustomerVisibleTimeline, getEmployeeScanHistory } from './timeline'

vi.mock('@/shared/db/server', () => ({ createClient: vi.fn() }))
vi.mock('@/shared/auth-helpers/require', () => ({
  requireOfficeStaff: vi.fn(),
  requireCustomer: vi.fn(),
}))

import { createClient } from '@/shared/db/server'
import { requireOfficeStaff, requireCustomer } from '@/shared/auth-helpers/require'

const JOB_ID = '88888888-8888-4888-8888-888888888888'
const EMP_ID = '99999999-9999-4999-8999-999999999999'

type ChainResult = { data: unknown[]; error: { message: string } | null }
const mockRange = vi.fn<() => Promise<ChainResult>>(() => Promise.resolve({ data: [], error: null }))
const mockOrder = vi.fn(() => ({ range: mockRange }))
const mockEqCustVisible = vi.fn(() => ({ order: mockOrder }))
const mockEqJob = vi.fn(() => ({ order: mockOrder, eq: mockEqCustVisible }))
const mockGte = vi.fn<() => Promise<ChainResult>>(() => Promise.resolve({ data: [], error: null }))
const mockLimitForEmp = vi.fn(() => ({ gte: mockGte }))
const mockOrderForEmp = vi.fn(() => ({ limit: mockLimitForEmp }))
const mockEqEmp = vi.fn(() => ({ order: mockOrderForEmp }))
const mockSelect = vi.fn((_cols: string) => ({ eq: mockEqJob }))
const mockSelectEmp = vi.fn((_cols: string) => ({ eq: mockEqEmp }))
const mockFrom = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  ;(requireOfficeStaff as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'u1' })
  ;(requireCustomer as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'c1' })
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: mockFrom })
  mockRange.mockResolvedValue({
    data: [
      {
        id: 'evt-1',
        event_type: 'stage_change',
        from_status: 'received',
        to_status: 'prep',
        is_rework: false,
        is_unusual_transition: false,
        shop_employee_id: EMP_ID,
        workstation_id: null,
        attachment_id: null,
        customer_visible: true,
        notes: null,
        scanned_at: '2026-05-01T12:00:00Z',
        duration_seconds: 120,
      },
    ],
    error: null,
  })
})

describe('getJobTimeline', () => {
  beforeEach(() => {
    mockFrom.mockReturnValue({ select: mockSelect })
  })

  it('fetches events for a job, ordered by scanned_at desc, paginated', async () => {
    const events = await getJobTimeline({ job_id: JOB_ID, limit: 50, offset: 0 })

    expect(requireOfficeStaff).toHaveBeenCalled()
    expect(mockFrom).toHaveBeenCalledWith('job_status_history')
    expect(mockEqJob).toHaveBeenCalledWith('job_id', JOB_ID)
    expect(mockOrder).toHaveBeenCalledWith('scanned_at', { ascending: false })
    expect(mockRange).toHaveBeenCalledWith(0, 49)
    expect(events).toHaveLength(1)
    expect(events[0]?.event_type).toBe('stage_change')
  })

  it('rejects bad job_id', async () => {
    await expect(getJobTimeline({ job_id: 'no' })).rejects.toThrow()
  })

  it('throws on DB error', async () => {
    mockRange.mockResolvedValueOnce({ data: [], error: { message: 'rls denied' } })
    await expect(getJobTimeline({ job_id: JOB_ID })).rejects.toThrow('Timeline fetch failed')
  })
})

describe('getCustomerVisibleTimeline', () => {
  beforeEach(() => {
    mockFrom.mockReturnValue({ select: mockSelect })
  })

  it('uses requireCustomer guard and adds customer_visible=true filter', async () => {
    await getCustomerVisibleTimeline({ job_id: JOB_ID })

    expect(requireCustomer).toHaveBeenCalled()
    expect(requireOfficeStaff).not.toHaveBeenCalled()
    expect(mockEqCustVisible).toHaveBeenCalledWith('customer_visible', true)
  })
})

describe('getEmployeeScanHistory', () => {
  beforeEach(() => {
    mockFrom.mockReturnValue({ select: mockSelectEmp })
    mockGte.mockResolvedValue({ data: [], error: null })
  })

  it('filters by shop_employee_id and since when provided', async () => {
    const since = '2026-05-01T00:00:00.000Z'
    await getEmployeeScanHistory({ shop_employee_id: EMP_ID, since, limit: 25 })

    expect(mockEqEmp).toHaveBeenCalledWith('shop_employee_id', EMP_ID)
    expect(mockLimitForEmp).toHaveBeenCalledWith(25)
    expect(mockGte).toHaveBeenCalledWith('scanned_at', since)
  })
})
