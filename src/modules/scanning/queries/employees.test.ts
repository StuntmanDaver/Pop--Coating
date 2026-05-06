import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listShopEmployees } from './employees'

vi.mock('@/shared/db/server', () => ({ createClient: vi.fn() }))
vi.mock('@/shared/auth-helpers/require', () => ({ requireShopStaff: vi.fn() }))

import { createClient } from '@/shared/db/server'
import { requireShopStaff } from '@/shared/auth-helpers/require'

type QueryResult = { data: unknown[] | null; error: { message: string } | null }

function makeChain(result: QueryResult) {
  const chain: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'is', 'order']) chain[m] = vi.fn(() => chain)
  chain.then = (resolve: (value: QueryResult) => void) => resolve(result)
  return chain
}

const EMPLOYEE_ROWS = [
  { id: 'emp-1', display_name: 'Alice', avatar_url: null, is_active: true },
  { id: 'emp-2', display_name: 'Bob', avatar_url: 'https://example.com/bob.jpg', is_active: true },
]

beforeEach(() => {
  vi.clearAllMocks()
  ;(requireShopStaff as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'shop-1' })
})

describe('listShopEmployees', () => {
  it('calls requireShopStaff before querying', async () => {
    const chain = makeChain({ data: [], error: null })
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: () => chain })

    await listShopEmployees()

    expect(requireShopStaff).toHaveBeenCalledOnce()
  })

  it('queries the shop_employees table', async () => {
    const chain = makeChain({ data: EMPLOYEE_ROWS, error: null })
    const mockFrom = vi.fn(() => chain)
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: mockFrom })

    await listShopEmployees()

    expect(mockFrom).toHaveBeenCalledWith('shop_employees')
  })

  it('selects the correct columns', async () => {
    const chain = makeChain({ data: EMPLOYEE_ROWS, error: null })
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: () => chain })

    await listShopEmployees()

    expect(chain.select).toHaveBeenCalledWith('id, display_name, avatar_url, is_active')
  })

  it('filters by is_active=true', async () => {
    const chain = makeChain({ data: EMPLOYEE_ROWS, error: null })
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: () => chain })

    await listShopEmployees()

    expect(chain.eq).toHaveBeenCalledWith('is_active', true)
  })

  it('returns employee list on success (happy path)', async () => {
    const chain = makeChain({ data: EMPLOYEE_ROWS, error: null })
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: () => chain })

    const result = await listShopEmployees()

    expect(result).toEqual(EMPLOYEE_ROWS)
    expect(result).toHaveLength(2)
  })

  it('returns empty array when data is null', async () => {
    const chain = makeChain({ data: null, error: null })
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: () => chain })

    const result = await listShopEmployees()

    expect(result).toEqual([])
  })

  it('throws when Supabase returns an error', async () => {
    const chain = makeChain({ data: [], error: { message: 'rls denied' } })
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: () => chain })

    await expect(listShopEmployees()).rejects.toThrow('Employee list failed: rls denied')
  })
})
