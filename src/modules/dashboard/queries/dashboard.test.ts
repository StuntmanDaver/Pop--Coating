import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getDashboardCounts, getRecentJobs, getActiveWorkstations } from './dashboard'

vi.mock('@/shared/db/server', () => ({ createClient: vi.fn() }))
vi.mock('@/shared/auth-helpers/require', () => ({ requireOfficeStaff: vi.fn() }))

import { createClient } from '@/shared/db/server'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'

type CountResult = { count: number | null; error: { message: string } | null }
type ListResult = { data: unknown[]; error: { message: string } | null }

// Each query chain returns a thenable at the end. We model them as a chained-builder
// where every method returns `this` and awaiting the builder resolves to the result.
function makeChain<T>(result: T) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'is', 'order', 'limit']
  for (const m of methods) chain[m] = vi.fn(() => chain)
  // Make the chain itself awaitable — Promise resolution via `then` on the object.
  chain.then = (resolve: (value: T) => void) => resolve(result)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(requireOfficeStaff as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'u1' })
})

describe('getDashboardCounts', () => {
  it('returns counts of in_production, on_hold, overdue, due_this_week', async () => {
    const inProductionResult: CountResult = { count: 5, error: null }
    const onHoldResult: CountResult = { count: 2, error: null }
    const overdueResult: CountResult = { count: 1, error: null }
    const dueThisWeekResult: CountResult = { count: 3, error: null }

    let callIndex = 0
    const responses = [inProductionResult, onHoldResult, overdueResult, dueThisWeekResult]
    const mockFrom = vi.fn(() => makeChain(responses[callIndex++]))
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: mockFrom })

    const result = await getDashboardCounts()

    expect(mockFrom).toHaveBeenCalledTimes(4)
    expect(mockFrom).toHaveBeenCalledWith('jobs')
    expect(result).toEqual({
      jobs_in_production: 5,
      jobs_on_hold: 2,
      jobs_overdue: 1,
      jobs_due_this_week: 3,
    })
  })

  it('throws when any sub-query errors', async () => {
    const goodResult: CountResult = { count: 0, error: null }
    const badResult: CountResult = { count: null, error: { message: 'rls denied' } }
    const responses = [goodResult, goodResult, badResult, goodResult]

    let callIndex = 0
    const mockFrom = vi.fn(() => makeChain(responses[callIndex++]))
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: mockFrom })

    await expect(getDashboardCounts()).rejects.toThrow('Dashboard counts failed')
  })

  it('coerces null counts to 0', async () => {
    const nullResult: CountResult = { count: null, error: null }
    const mockFrom = vi.fn(() => makeChain(nullResult))
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: mockFrom })

    const result = await getDashboardCounts()
    expect(result).toEqual({
      jobs_in_production: 0,
      jobs_on_hold: 0,
      jobs_overdue: 0,
      jobs_due_this_week: 0,
    })
  })
})

describe('getRecentJobs', () => {
  it('returns the most recent N jobs (default 10)', async () => {
    const jobs = [
      {
        id: 'j1',
        job_number: 'POPS-2026-00001',
        job_name: 'Bumper',
        intake_status: 'in_production',
        production_status: 'coating',
        on_hold: false,
        due_date: '2026-06-01',
        priority: 'normal',
        created_at: '2026-05-01T12:00:00Z',
      },
    ]
    const result: ListResult = { data: jobs, error: null }
    const chain = makeChain(result)
    const mockFrom = vi.fn(() => chain)
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: mockFrom })

    const recent = await getRecentJobs()
    expect(mockFrom).toHaveBeenCalledWith('jobs')
    expect(chain.limit).toHaveBeenCalledWith(10)
    expect(recent).toHaveLength(1)
  })

  it('honors explicit limit', async () => {
    const result: ListResult = { data: [], error: null }
    const chain = makeChain(result)
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: () => chain })
    await getRecentJobs(25)
    expect(chain.limit).toHaveBeenCalledWith(25)
  })
})

describe('getActiveWorkstations', () => {
  it('queries workstations with heartbeat within last 5 minutes', async () => {
    const result: ListResult = {
      data: [
        {
          id: 'w1',
          name: 'Station 1',
          default_stage: 'coating',
          last_activity_at: new Date().toISOString(),
          current_employee_id: 'e1',
        },
      ],
      error: null,
    }
    const chain = makeChain(result)
    const mockFrom = vi.fn(() => chain)
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: mockFrom })

    const stations = await getActiveWorkstations()
    expect(mockFrom).toHaveBeenCalledWith('workstations')
    // gte called with an ISO timestamp roughly 5 minutes ago
    expect(chain.gte).toHaveBeenCalledWith('last_activity_at', expect.any(String))
    expect(stations).toHaveLength(1)
  })

  it('throws on DB error', async () => {
    const result: ListResult = { data: [], error: { message: 'rls denied' } }
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: () => makeChain(result) })
    await expect(getActiveWorkstations()).rejects.toThrow('Active workstations failed')
  })
})
