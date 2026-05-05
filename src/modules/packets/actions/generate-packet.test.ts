import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generatePacketPdf } from './generate-packet'

vi.mock('@/shared/db/server', () => ({ createClient: vi.fn() }))
vi.mock('@/shared/auth-helpers/require', () => ({ requireOfficeStaff: vi.fn() }))
vi.mock('@/shared/audit', () => ({ logAuditEvent: vi.fn().mockResolvedValue(undefined) }))

import { createClient } from '@/shared/db/server'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'
import { logAuditEvent } from '@/shared/audit'

const JOB_ID = '88888888-8888-4888-8888-888888888888'
const TOKEN = 'abcdefghijKLMNOP' // 16 chars, last 8 = 'IJKLMNOP'

const SAMPLE_JOB = {
  id: JOB_ID,
  job_number: 'POPS-2026-00042',
  job_name: 'Bumper, gloss black',
  description: 'OEM Mustang front bumper',
  customer_po_number: 'PO-9912',
  color: 'Gloss Black',
  coating_type: 'Powder',
  part_count: 2,
  weight_lbs: 18.5,
  dimensions_text: '60x18x12 in',
  due_date: '2026-06-01',
  priority: 'rush',
  packet_token: TOKEN,
  companies: { name: 'Acme Restorations' },
  contacts: { first_name: 'Pat', last_name: 'Tanaka' },
  tenants: { name: 'Pops Industrial Coatings' },
}

type ErrResult = { error: { message: string } | null }
const mockMaybeSingle = vi.fn()
const mockEqRead = vi.fn(() => ({ maybeSingle: mockMaybeSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEqRead }))
const mockUpdateEq = vi.fn<() => Promise<ErrResult>>(() => Promise.resolve({ error: null }))
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect, update: mockUpdate }))

beforeEach(() => {
  vi.clearAllMocks()
  ;(requireOfficeStaff as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'u1' })
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: mockFrom })
  mockMaybeSingle.mockResolvedValue({ data: SAMPLE_JOB, error: null })
})

describe('generatePacketPdf', () => {
  // Real renderer integration — slow, but the only way to verify the PDF stream
  // pipeline (QR PNG embed → react-pdf → Buffer) actually works.
  it('renders a real PDF buffer with the canonical %PDF magic header', async () => {
    const result = await generatePacketPdf({ job_id: JOB_ID })

    expect(result.job_number).toBe('POPS-2026-00042')
    expect(result.packet_token).toBe(TOKEN)
    expect(Buffer.isBuffer(result.pdf)).toBe(true)
    // Every PDF starts with the bytes "%PDF-".
    expect(result.pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-')
    // Sanity bound — a one-page packet with QR is well over 1 KB.
    expect(result.pdf.byteLength).toBeGreaterThan(1024)
  }, 30000)

  it('clears packet_dirty after successful render', async () => {
    await generatePacketPdf({ job_id: JOB_ID })
    expect(mockUpdate).toHaveBeenCalledWith({ packet_dirty: false })
    expect(mockUpdateEq).toHaveBeenCalledWith('id', JOB_ID)
  }, 30000)

  it('audits the packet_dirty clear', async () => {
    await generatePacketPdf({ job_id: JOB_ID })
    expect(logAuditEvent).toHaveBeenCalledWith({
      action: 'update',
      entity_type: 'job',
      entity_id: JOB_ID,
      changed_fields: { packet_dirty: false },
    })
  }, 30000)

  it('audits the packet_dirty clear FAILURE path differently (pdf still returned)', async () => {
    mockUpdateEq.mockResolvedValueOnce({ error: { message: 'rls denied' } })
    const result = await generatePacketPdf({ job_id: JOB_ID })
    // PDF still came back (don't lose work on a downstream RLS hiccup)
    expect(Buffer.isBuffer(result.pdf)).toBe(true)
    expect(logAuditEvent).toHaveBeenCalledWith({
      action: 'update',
      entity_type: 'job',
      entity_id: JOB_ID,
      changed_fields: { packet_dirty: 'clear-failed', error: 'rls denied' },
    })
  }, 30000)

  it('throws when job not found', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    await expect(generatePacketPdf({ job_id: JOB_ID })).rejects.toThrow('Job not found')
  })

  it('throws when company link missing (data integrity check)', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { ...SAMPLE_JOB, companies: null },
      error: null,
    })
    await expect(generatePacketPdf({ job_id: JOB_ID })).rejects.toThrow('missing company link')
  })

  it('throws when tenant link missing', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { ...SAMPLE_JOB, tenants: null },
      error: null,
    })
    await expect(generatePacketPdf({ job_id: JOB_ID })).rejects.toThrow('missing tenant link')
  })

  it('rejects bad job_id', async () => {
    await expect(generatePacketPdf({ job_id: 'no' })).rejects.toThrow('Invalid input')
  })

  it('throws when DB read errors', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'rls denied' } })
    await expect(generatePacketPdf({ job_id: JOB_ID })).rejects.toThrow('Job lookup failed: rls denied')
  })

  it('rejects when requireOfficeStaff denies', async () => {
    ;(requireOfficeStaff as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('redirect'))
    await expect(generatePacketPdf({ job_id: JOB_ID })).rejects.toThrow('redirect')
  })
})
