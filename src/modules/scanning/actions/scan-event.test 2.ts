import { describe, it, expect, vi, beforeEach } from 'vitest'
import { recordScanEvent } from './scan-event'

vi.mock('@/shared/db/server', () => ({ createClient: vi.fn() }))
vi.mock('@/shared/auth-helpers/require', () => ({ requireShopStaff: vi.fn() }))

import { createClient } from '@/shared/db/server'
import { requireShopStaff } from '@/shared/auth-helpers/require'

const JOB_ID = '88888888-8888-4888-8888-888888888888'
const EMP_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const WS_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const ATTACH_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const EVENT_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'

type RpcResult = { data: string | null; error: { message: string } | null }
const mockRpc = vi.fn<(fn: string, args?: unknown) => Promise<RpcResult>>(() =>
  Promise.resolve({ data: null, error: null })
)
const mockSchema = vi.fn((_name: string) => ({ rpc: mockRpc }))

beforeEach(() => {
  vi.clearAllMocks()
  ;(requireShopStaff as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'shop-1' })
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ schema: mockSchema })
  mockRpc.mockResolvedValue({ data: EVENT_ID, error: null })
})

describe('recordScanEvent', () => {
  it('routes through .schema("app") with all 6 params; does not pass tenant', async () => {
    const result = await recordScanEvent({
      job_id: JOB_ID,
      to_status: 'coating',
      employee_id: EMP_ID,
      workstation_id: WS_ID,
      notes: 'first coat',
      attachment_id: ATTACH_ID,
    })

    expect(mockSchema).toHaveBeenCalledWith('app')
    expect(mockRpc).toHaveBeenCalledWith('record_scan_event', {
      p_job_id: JOB_ID,
      p_to_status: 'coating',
      p_employee_id: EMP_ID,
      p_workstation_id: WS_ID,
      p_notes: 'first coat',
      p_attachment_id: ATTACH_ID,
    })
    // Tenant comes from JWT inside the function — we never pass it
    const call = mockRpc.mock.calls[0]?.[1] as Record<string, unknown> | undefined
    expect(call).not.toHaveProperty('p_tenant_id')

    expect(result).toEqual({ event_id: EVENT_ID, job_id: JOB_ID, to_status: 'coating' })
  })

  it('passes nulls when notes + attachment_id omitted', async () => {
    await recordScanEvent({
      job_id: JOB_ID,
      to_status: 'received',
      employee_id: EMP_ID,
      workstation_id: WS_ID,
    })
    expect(mockRpc).toHaveBeenCalledWith('record_scan_event', expect.objectContaining({
      p_notes: null,
      p_attachment_id: null,
    }))
  })

  it('rejects invalid to_status (catches before RPC call)', async () => {
    await expect(
      recordScanEvent({
        job_id: JOB_ID,
        to_status: 'shipping',
        employee_id: EMP_ID,
        workstation_id: WS_ID,
      })
    ).rejects.toThrow('Invalid input')
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('surfaces SECURITY DEFINER cross-tenant raise', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'access_denied: cross-tenant scan blocked' },
    })
    await expect(
      recordScanEvent({
        job_id: JOB_ID,
        to_status: 'qc',
        employee_id: EMP_ID,
        workstation_id: WS_ID,
      })
    ).rejects.toThrow('Scan event failed: access_denied: cross-tenant scan blocked')
  })

  it('throws when RPC returns null event_id', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null })
    await expect(
      recordScanEvent({
        job_id: JOB_ID,
        to_status: 'qc',
        employee_id: EMP_ID,
        workstation_id: WS_ID,
      })
    ).rejects.toThrow('no event_id returned')
  })

  it('rejects when requireShopStaff denies', async () => {
    ;(requireShopStaff as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('redirect'))
    await expect(
      recordScanEvent({
        job_id: JOB_ID,
        to_status: 'received',
        employee_id: EMP_ID,
        workstation_id: WS_ID,
      })
    ).rejects.toThrow('redirect')
  })
})
