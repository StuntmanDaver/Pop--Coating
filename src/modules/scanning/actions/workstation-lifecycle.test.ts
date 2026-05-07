import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  claimWorkstation,
  recordWorkstationHeartbeat,
  releaseWorkstation,
} from './workstation-lifecycle'

vi.mock('@/shared/db/server', () => ({ createClient: vi.fn() }))
vi.mock('@/shared/auth-helpers/require', () => ({ requireShopStaff: vi.fn() }))

import { createClient } from '@/shared/db/server'
import { requireShopStaff } from '@/shared/auth-helpers/require'

const WS_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const EMP_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

type RpcResult = { data: unknown | null; error: { message: string } | null }
const mockRpc = vi.fn<(fn: string, args?: unknown) => Promise<RpcResult>>(() =>
  Promise.resolve({ data: null, error: null })
)
const mockSchema = vi.fn((_name: string) => ({ rpc: mockRpc }))

beforeEach(() => {
  vi.clearAllMocks()
  ;(requireShopStaff as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'shop-user' })
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ schema: mockSchema })
  mockRpc.mockResolvedValue({ data: { ok: true, version: 1 }, error: null })
})

describe('claimWorkstation', () => {
  it('routes through .schema("app") and calls claim_workstation with snake_cased params', async () => {
    const result = await claimWorkstation({
      workstation_id: WS_ID,
      employee_id: EMP_ID,
      expected_version: 0,
    })

    expect(requireShopStaff).toHaveBeenCalled()
    expect(mockSchema).toHaveBeenCalledWith('app')
    expect(mockRpc).toHaveBeenCalledWith('claim_workstation', {
      p_workstation_id: WS_ID,
      p_employee_id: EMP_ID,
      p_expected_version: 0,
    })
    if (!result.ok) throw new Error('Expected workstation claim to succeed')
    expect(result.version).toBe(1)
  })

  it('rejects bad UUIDs', async () => {
    await expect(
      claimWorkstation({ workstation_id: 'no', employee_id: EMP_ID, expected_version: 0 })
    ).rejects.toThrow('Invalid input')
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('surfaces SECURITY DEFINER access_denied raises', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'access_denied: can only claim own workstation' },
    })
    await expect(
      claimWorkstation({ workstation_id: WS_ID, employee_id: EMP_ID, expected_version: 0 })
    ).rejects.toThrow('Workstation claim failed: access_denied')
  })

  it('throws when RPC returns null result with no error', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null })
    await expect(
      claimWorkstation({ workstation_id: WS_ID, employee_id: EMP_ID, expected_version: 0 })
    ).rejects.toThrow('no result')
  })
})

describe('recordWorkstationHeartbeat', () => {
  it('calls heartbeat RPC with no params', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null })
    const result = await recordWorkstationHeartbeat()
    expect(mockRpc).toHaveBeenCalledWith('record_workstation_heartbeat')
    expect(result).toEqual({ ok: true })
  })

  it('throws on RPC error', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'access_denied: heartbeat requires shop session' },
    })
    await expect(recordWorkstationHeartbeat()).rejects.toThrow('Heartbeat failed: access_denied')
  })
})

describe('releaseWorkstation', () => {
  it('calls release RPC with no params', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null })
    const result = await releaseWorkstation()
    expect(mockRpc).toHaveBeenCalledWith('release_workstation')
    expect(result).toEqual({ ok: true })
  })

  it('throws on RPC error', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'rls denied' },
    })
    await expect(releaseWorkstation()).rejects.toThrow('Workstation release failed: rls denied')
  })
})
