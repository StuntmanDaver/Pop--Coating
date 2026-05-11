import { describe, it, expect, vi, beforeEach } from 'vitest'
import { lookupJobByPacketToken } from './lookup'

vi.mock('@/shared/db/server', () => ({ createClient: vi.fn() }))
vi.mock('@/shared/auth-helpers/require', () => ({ requireShopStaff: vi.fn() }))

import { createClient } from '@/shared/db/server'
import { requireShopStaff } from '@/shared/auth-helpers/require'

const FULL_TOKEN = 'abcdefghijKLMNOP'
const SUFFIX = 'IJKLMNOP'
const JOB_ROW = {
  id: '88888888-8888-4888-8888-888888888888',
  job_number: 'POPS-2026-00042',
  job_name: 'Bumper coat',
  intake_status: 'in_production',
  production_status: 'coating',
  on_hold: false,
  packet_token: FULL_TOKEN,
}

type ListResult = { data: unknown[]; error: { message: string } | null }

function makeChain(result: ListResult) {
  const chain: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'ilike', 'limit']) chain[m] = vi.fn(() => chain)
  chain.then = (resolve: (value: ListResult) => void) => resolve(result)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(requireShopStaff as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'shop-1' })
})

describe('lookupJobByPacketToken', () => {
  it('uses .eq() for full 16-char token', async () => {
    const chain = makeChain({ data: [JOB_ROW], error: null })
    const mockFrom = vi.fn(() => chain)
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: mockFrom })

    const result = await lookupJobByPacketToken({ token_or_prefix: FULL_TOKEN })

    expect(mockFrom).toHaveBeenCalledWith('jobs')
    expect(chain.eq).toHaveBeenCalledWith('packet_token', FULL_TOKEN)
    expect(chain.ilike).not.toHaveBeenCalled()
    expect(chain.limit).toHaveBeenCalledWith(2)
    expect(result?.id).toBe(JOB_ROW.id)
  })

  it('uses .ilike() with leading wildcard for 8-char manual-entry suffix', async () => {
    const chain = makeChain({ data: [JOB_ROW], error: null })
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: () => chain })

    await lookupJobByPacketToken({ token_or_prefix: SUFFIX })
    expect(chain.ilike).toHaveBeenCalledWith('packet_token', `%${SUFFIX}`)
    expect(chain.eq).not.toHaveBeenCalled()
  })

  it('returns null when no job found', async () => {
    const chain = makeChain({ data: [], error: null })
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: () => chain })
    const result = await lookupJobByPacketToken({ token_or_prefix: SUFFIX })
    expect(result).toBeNull()
  })

  it('throws on suffix collision (returns >1 row)', async () => {
    const chain = makeChain({ data: [JOB_ROW, { ...JOB_ROW, id: 'other' }], error: null })
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: () => chain })
    await expect(lookupJobByPacketToken({ token_or_prefix: SUFFIX })).rejects.toThrow(
      'Ambiguous packet token'
    )
  })

  it('rejects token shorter than 8 chars', async () => {
    await expect(lookupJobByPacketToken({ token_or_prefix: 'short' })).rejects.toThrow('Invalid input')
  })

  it('rejects token longer than 16 chars', async () => {
    await expect(
      lookupJobByPacketToken({ token_or_prefix: 'a'.repeat(17) })
    ).rejects.toThrow('Invalid input')
  })

  it('throws on DB error', async () => {
    const chain = makeChain({ data: [], error: { message: 'rls denied' } })
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: () => chain })
    await expect(lookupJobByPacketToken({ token_or_prefix: SUFFIX })).rejects.toThrow(
      'Packet lookup failed: rls denied'
    )
  })
})
