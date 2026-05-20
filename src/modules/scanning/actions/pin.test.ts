import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateEmployeePin } from './pin'

vi.mock('@/shared/db/server', () => ({ createClient: vi.fn() }))

import { createClient } from '@/shared/db/server'

const EMP_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

type RpcResult = { data: unknown | null; error: { message: string } | null }
const mockRpc = vi.fn<(fn: string, args?: unknown) => Promise<RpcResult>>(() =>
  Promise.resolve({ data: null, error: null })
)
const mockSchema = vi.fn((_name: string) => ({ rpc: mockRpc }))

beforeEach(() => {
  vi.clearAllMocks()
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            app_metadata: {
              audience: 'staff_shop',
              tenant_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            },
          },
        },
        error: null,
      }),
    },
    schema: mockSchema,
  })
})

describe('validateEmployeePin', () => {
  it('routes through .schema("app") without caller-supplied tenant_id', async () => {
    mockRpc.mockResolvedValueOnce({ data: { ok: true, employee_id: EMP_ID }, error: null })
    const result = await validateEmployeePin({ employee_id: EMP_ID, pin: '1234' })

    expect(mockSchema).toHaveBeenCalledWith('app')
    expect(mockRpc).toHaveBeenCalledWith('validate_employee_pin', {
      p_employee_id: EMP_ID,
      p_pin: '1234',
    })
    expect(mockRpc.mock.calls[0]?.[1]).not.toHaveProperty('p_tenant_id')
    expect(result).toEqual({ ok: true, employee_id: EMP_ID })
  })

  it('narrows tenant_mismatch result to discriminated union', async () => {
    mockRpc.mockResolvedValueOnce({ data: { ok: false, reason: 'tenant_mismatch' }, error: null })
    const result = await validateEmployeePin({ employee_id: EMP_ID, pin: '1234' })
    expect(result).toEqual({ ok: false, reason: 'tenant_mismatch' })
  })

  it('narrows inactive result', async () => {
    mockRpc.mockResolvedValueOnce({ data: { ok: false, reason: 'inactive' }, error: null })
    const result = await validateEmployeePin({ employee_id: EMP_ID, pin: '1234' })
    expect(result).toEqual({ ok: false, reason: 'inactive' })
  })

  it('narrows locked result with until timestamp', async () => {
    const until = '2026-05-05T03:00:00Z'
    mockRpc.mockResolvedValueOnce({
      data: { ok: false, reason: 'locked', until },
      error: null,
    })
    const result = await validateEmployeePin({ employee_id: EMP_ID, pin: '1234' })
    expect(result).toEqual({ ok: false, reason: 'locked', until })
  })

  it('narrows invalid_pin result with attempts_remaining', async () => {
    mockRpc.mockResolvedValueOnce({
      data: { ok: false, reason: 'invalid_pin', attempts_remaining: 3 },
      error: null,
    })
    const result = await validateEmployeePin({ employee_id: EMP_ID, pin: '0000' })
    expect(result).toEqual({ ok: false, reason: 'invalid_pin', attempts_remaining: 3 })
  })

  it('throws on unrecognized reason (defensive — schema drift)', async () => {
    mockRpc.mockResolvedValueOnce({
      data: { ok: false, reason: 'something_new' },
      error: null,
    })
    await expect(validateEmployeePin({ employee_id: EMP_ID, pin: '1234' })).rejects.toThrow(
      'unrecognized result'
    )
  })

  it('rejects PIN shorter than 4 chars', async () => {
    await expect(validateEmployeePin({ employee_id: EMP_ID, pin: '12' })).rejects.toThrow(
      'Invalid input'
    )
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('rejects bad employee uuid', async () => {
    await expect(validateEmployeePin({ employee_id: 'no', pin: '1234' })).rejects.toThrow(
      'Invalid input'
    )
  })

  it('returns tenant_mismatch on RPC error', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'permission denied' } })
    await expect(validateEmployeePin({ employee_id: EMP_ID, pin: '1234' })).resolves.toEqual({
      ok: false,
      reason: 'tenant_mismatch',
    })
  })
})
