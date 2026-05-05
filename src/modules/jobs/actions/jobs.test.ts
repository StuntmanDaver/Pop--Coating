import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createJob, updateJob, setJobHold, archiveJob } from './jobs'

vi.mock('@/shared/db/server', () => ({ createClient: vi.fn() }))
vi.mock('@/shared/auth-helpers/require', () => ({ requireOfficeStaff: vi.fn() }))
vi.mock('@/shared/auth-helpers/claims', () => ({ getCurrentClaims: vi.fn() }))
vi.mock('@/shared/audit', () => ({ logAuditEvent: vi.fn().mockResolvedValue(undefined) }))

import { createClient } from '@/shared/db/server'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'

const TENANT_ID = '11111111-1111-4111-8111-111111111111'
const COMPANY_ID = '22222222-2222-4222-8222-222222222222'
const JOB_ID = '88888888-8888-4888-8888-888888888888'
const STAFF_ID = '44444444-4444-4444-8444-444444444444'

const mockSingle = vi.fn()
const mockSelect = vi.fn(() => ({ single: mockSingle }))
const mockInsert = vi.fn((_data: unknown) => ({ select: mockSelect }))
type ErrResult = { error: { message: string } | null }
const mockUpdateEq = vi.fn<() => Promise<ErrResult>>(() => Promise.resolve({ error: null }))
const mockUpdate = vi.fn((_data: unknown) => ({ eq: mockUpdateEq }))
const mockRpc = vi.fn((_fn: string) => Promise.resolve({ data: null as string | null, error: null as { message: string } | null }))
const mockFrom = vi.fn((_table: string) => ({ insert: mockInsert, update: mockUpdate }))

beforeEach(() => {
  vi.clearAllMocks()
  ;(requireOfficeStaff as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'u1' })
  ;(getCurrentClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
    tenant_id: TENANT_ID,
    audience: 'staff_office',
    role: 'admin',
    staff_id: STAFF_ID,
  })
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: mockFrom, rpc: mockRpc })

  mockRpc.mockResolvedValue({ data: 'POPS-2026-00001', error: null })
  mockSingle.mockResolvedValue({
    data: {
      id: JOB_ID,
      tenant_id: TENANT_ID,
      job_number: 'POPS-2026-00001',
      packet_token: 'abc123def456ghij',
    },
    error: null,
  })
})

describe('createJob', () => {
  it('calls next_job_number RPC then inserts with the returned number + a 16-char packet_token', async () => {
    const result = await createJob({
      company_id: COMPANY_ID,
      job_name: 'Bumper coat',
    })

    expect(mockRpc).toHaveBeenCalledWith('next_job_number')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: TENANT_ID,
        job_number: 'POPS-2026-00001',
        company_id: COMPANY_ID,
        job_name: 'Bumper coat',
        priority: 'normal',
        intake_status: 'draft',
        created_by_staff_id: STAFF_ID,
      })
    )
    const insertArg = mockInsert.mock.calls[0]?.[0] as { packet_token: string } | undefined
    expect(insertArg?.packet_token).toMatch(/^[A-Za-z0-9_-]{16}$/)
    expect(result.id).toBe(JOB_ID)
  })

  it('throws when next_job_number RPC fails', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'access_denied' } })
    await expect(createJob({ company_id: COMPANY_ID, job_name: 'X' })).rejects.toThrow(
      'Job number generation failed: access_denied'
    )
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('rejects intake_status=in_production at the schema (transitions go via scanning)', async () => {
    await expect(
      createJob({ company_id: COMPANY_ID, job_name: 'X', intake_status: 'in_production' })
    ).rejects.toThrow('Invalid input')
  })

  it('rejects unknown priority', async () => {
    await expect(
      createJob({ company_id: COMPANY_ID, job_name: 'X', priority: 'urgent' })
    ).rejects.toThrow('Invalid input')
  })
})

describe('updateJob', () => {
  it('strips production_status if it sneaks into the patch', async () => {
    // Force the value through by casting — schema would normally reject it.
    await updateJob({
      id: JOB_ID,
      job_name: 'Renamed',
      production_status: 'coating',
    } as unknown as { id: string; job_name: string })

    const updateArg = mockUpdate.mock.calls[0]?.[0] as Record<string, unknown> | undefined
    // production_status is rejected by the schema; only job_name should pass through.
    expect(updateArg).toEqual({ job_name: 'Renamed' })
    expect(updateArg).not.toHaveProperty('production_status')
  })

  it('updates allowed fields only', async () => {
    await updateJob({ id: JOB_ID, due_date: '2026-06-01', priority: 'rush' })
    expect(mockUpdate).toHaveBeenCalledWith({ due_date: '2026-06-01', priority: 'rush' })
  })

  it('throws on DB error', async () => {
    mockUpdateEq.mockResolvedValueOnce({ error: { message: 'rls denied' } })
    await expect(updateJob({ id: JOB_ID, job_name: 'X' })).rejects.toThrow('Job update failed')
  })
})

describe('setJobHold', () => {
  it('requires hold_reason when on_hold=true', async () => {
    await expect(setJobHold({ id: JOB_ID, on_hold: true })).rejects.toThrow('hold_reason required')
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('clears hold_reason when on_hold=false', async () => {
    await setJobHold({ id: JOB_ID, on_hold: false })
    expect(mockUpdate).toHaveBeenCalledWith({ on_hold: false, hold_reason: null })
  })

  it('sets on_hold=true with reason', async () => {
    await setJobHold({ id: JOB_ID, on_hold: true, hold_reason: 'awaiting customer approval' })
    expect(mockUpdate).toHaveBeenCalledWith({
      on_hold: true,
      hold_reason: 'awaiting customer approval',
    })
  })
})

describe('archiveJob', () => {
  it('sets archived_at + intake_status=archived', async () => {
    await archiveJob({ id: JOB_ID })
    const arg = mockUpdate.mock.calls[0]?.[0] as { archived_at: string; intake_status: string } | undefined
    expect(arg?.intake_status).toBe('archived')
    expect(arg?.archived_at).toEqual(expect.any(String))
  })
})
