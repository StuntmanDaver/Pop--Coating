import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  archiveJob,
  createJob,
  scheduleJob,
  setJobHold,
  splitJobForMultiColor,
  updateJob,
} from './jobs'

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
const mockUpdate = vi.fn<(_data: unknown) => unknown>(() => ({ eq: mockUpdateEq }))
const mockRpc = vi.fn((_fn: string) => Promise.resolve({ data: null as string | null, error: null as { message: string } | null }))
const mockSchema = vi.fn((_name: string) => ({ rpc: mockRpc }))
const mockFrom = vi.fn<(_table: string) => unknown>(() => ({ insert: mockInsert, update: mockUpdate }))

beforeEach(() => {
  vi.clearAllMocks()
  ;(requireOfficeStaff as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'u1' })
  ;(getCurrentClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
    tenant_id: TENANT_ID,
    audience: 'staff_office',
    role: 'admin',
    staff_id: STAFF_ID,
  })
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: mockFrom, schema: mockSchema })

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
  it('routes RPC through .schema("app") for next_job_number then inserts with returned number + 16-char packet_token', async () => {
    const result = await createJob({
      company_id: COMPANY_ID,
      job_name: 'Bumper coat',
    })

    expect(mockSchema).toHaveBeenCalledWith('app')
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

describe('scheduleJob', () => {
  it('only moves draft jobs to scheduled', async () => {
    const statusEq = vi.fn(() => Promise.resolve({ error: null }))
    const idEq = vi.fn(() => ({ eq: statusEq }))
    mockUpdate.mockReturnValueOnce({ eq: idEq })

    await scheduleJob({ id: JOB_ID })

    expect(mockUpdate).toHaveBeenCalledWith({ intake_status: 'scheduled' })
    expect(idEq).toHaveBeenCalledWith('id', JOB_ID)
    expect(statusEq).toHaveBeenCalledWith('intake_status', 'draft')
  })

  it('rejects invalid ids', async () => {
    await expect(scheduleJob({ id: 'not-a-uuid' })).rejects.toThrow('Invalid input')
  })
})

describe('splitJobForMultiColor', () => {
  const parentJob = {
    id: JOB_ID,
    tenant_id: TENANT_ID,
    parent_job_id: null,
    job_number: 'POPS-2026-00001',
    packet_token: 'parent-token',
    company_id: COMPANY_ID,
    contact_id: null,
    job_name: 'Two-tone gate',
    description: 'Main gate assembly',
    customer_po_number: 'PO-123',
    part_count: 6,
    weight_lbs: 82.5,
    dimensions_text: '72x42x4 in',
    color: 'Black',
    coating_type: 'Powder',
    due_date: '2026-06-01',
    priority: 'normal',
    intake_status: 'scheduled',
    quoted_price: 1200,
    notes: 'Mask hinge pins.',
  }

  it('creates a child job from a draft or scheduled parent', async () => {
    const parentMaybeSingle = vi.fn(() => Promise.resolve({ data: parentJob, error: null }))
    const parentEq = vi.fn(() => ({ maybeSingle: parentMaybeSingle }))
    const parentSelect = vi.fn(() => ({ eq: parentEq }))
    const childSingle = vi.fn(() =>
      Promise.resolve({
        data: {
          id: '99999999-9999-4999-8999-999999999999',
          tenant_id: TENANT_ID,
          job_number: 'POPS-2026-00002',
          packet_token: 'child-token',
        },
        error: null,
      })
    )
    const childSelect = vi.fn(() => ({ single: childSingle }))
    const childInsert = vi.fn((_data: unknown) => ({ select: childSelect }))
    mockFrom
      .mockReturnValueOnce({ select: parentSelect })
      .mockReturnValueOnce({ insert: childInsert })

    const result = await splitJobForMultiColor({
      parent_job_id: JOB_ID,
      color: 'Signal White',
      part_count: 2,
    })

    expect(result.job_number).toBe('POPS-2026-00002')
    expect(childInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: TENANT_ID,
        parent_job_id: JOB_ID,
        company_id: COMPANY_ID,
        job_name: 'Two-tone gate - Signal White',
        color: 'Signal White',
        part_count: 2,
        intake_status: 'scheduled',
      })
    )
  })

  it('rejects parents that are already in production', async () => {
    const parentMaybeSingle = vi.fn(() =>
      Promise.resolve({
        data: { ...parentJob, intake_status: 'in_production' },
        error: null,
      })
    )
    const parentEq = vi.fn(() => ({ maybeSingle: parentMaybeSingle }))
    const parentSelect = vi.fn(() => ({ eq: parentEq }))
    mockFrom.mockReturnValueOnce({ select: parentSelect })

    await expect(
      splitJobForMultiColor({ parent_job_id: JOB_ID, color: 'Signal White' })
    ).rejects.toThrow('draft or scheduled')
  })

  it('rejects child jobs as split parents', async () => {
    const parentMaybeSingle = vi.fn(() =>
      Promise.resolve({
        data: { ...parentJob, parent_job_id: '77777777-7777-4777-8777-777777777777' },
        error: null,
      })
    )
    const parentEq = vi.fn(() => ({ maybeSingle: parentMaybeSingle }))
    const parentSelect = vi.fn(() => ({ eq: parentEq }))
    mockFrom.mockReturnValueOnce({ select: parentSelect })

    await expect(
      splitJobForMultiColor({ parent_job_id: JOB_ID, color: 'Signal White' })
    ).rejects.toThrow('Only parent jobs')
  })
})
