import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listMyJobs, getMyJob } from './portal'

vi.mock('@/shared/db/server', () => ({ createClient: vi.fn() }))
vi.mock('@/shared/auth-helpers/require', () => ({ requireCustomer: vi.fn() }))
vi.mock('@/shared/auth-helpers/claims', () => ({ getCurrentClaims: vi.fn() }))

import { createClient } from '@/shared/db/server'
import { requireCustomer } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'

const COMPANY_ID = '22222222-2222-4222-8222-222222222222'
const JOB_ID = '88888888-8888-4888-8888-888888888888'

type ListResult = { data: unknown[]; error: { message: string } | null }
type SingleResult = { data: unknown | null; error: { message: string } | null }

function makeChain<T>(result: T) {
  const chain: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'is', 'order', 'range', 'maybeSingle']) {
    chain[m] = vi.fn(() => chain)
  }
  chain.then = (resolve: (value: T) => void) => resolve(result)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(requireCustomer as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'c1' })
  ;(getCurrentClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
    audience: 'customer',
    company_id: COMPANY_ID,
    role: 'customer',
    tenant_id: 'tenant-1',
  })
})

describe('listMyJobs', () => {
  it('filters by claims.company_id and excludes archived', async () => {
    const result: ListResult = { data: [], error: null }
    const chain = makeChain(result)
    const mockFrom = vi.fn(() => chain)
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: mockFrom })

    await listMyJobs()

    expect(requireCustomer).toHaveBeenCalled()
    expect(mockFrom).toHaveBeenCalledWith('jobs')
    expect(chain.eq).toHaveBeenCalledWith('company_id', COMPANY_ID)
    expect(chain.is).toHaveBeenCalledWith('archived_at', null)
  })

  it('throws when claims have no company_id', async () => {
    ;(getCurrentClaims as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      audience: 'customer',
      role: 'customer',
      tenant_id: 'tenant-1',
    })
    await expect(listMyJobs()).rejects.toThrow('Portal access requires company_id')
  })

  it('rejects bad intake_status filter', async () => {
    await expect(listMyJobs({ intake_status: 'pending' })).rejects.toThrow()
  })

  it('paginates with limit/offset', async () => {
    const result: ListResult = { data: [], error: null }
    const chain = makeChain(result)
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: () => chain })

    await listMyJobs({ limit: 10, offset: 20 })
    expect(chain.range).toHaveBeenCalledWith(20, 29)
  })

  it('throws on DB error', async () => {
    const result: ListResult = { data: [], error: { message: 'rls denied' } }
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: () => makeChain(result) })
    await expect(listMyJobs()).rejects.toThrow('Portal job list failed')
  })
})

describe('getMyJob', () => {
  it('filters by both id AND company_id (defense in depth + RLS)', async () => {
    const result: SingleResult = {
      data: { id: JOB_ID, job_number: 'POPS-2026-00001', job_name: 'Bumper' },
      error: null,
    }
    const chain = makeChain(result)
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: () => chain })

    await getMyJob({ id: JOB_ID })

    expect(chain.eq).toHaveBeenCalledWith('id', JOB_ID)
    expect(chain.eq).toHaveBeenCalledWith('company_id', COMPANY_ID)
    expect(chain.is).toHaveBeenCalledWith('archived_at', null)
    expect(chain.maybeSingle).toHaveBeenCalled()
  })

  it('returns null when not found', async () => {
    const result: SingleResult = { data: null, error: null }
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: () => makeChain(result) })
    const job = await getMyJob({ id: JOB_ID })
    expect(job).toBeNull()
  })
})
