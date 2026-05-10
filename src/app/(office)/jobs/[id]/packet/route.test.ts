import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/modules/packets', () => ({ generatePacketPdf: vi.fn() }))

import { generatePacketPdf } from '@/modules/packets'
import { GET } from './route'

const JOB_ID = '88888888-8888-4888-8888-888888888888'

const SAMPLE_PDF = Buffer.from('%PDF-1.7 sample bytes here')

beforeEach(() => {
  vi.clearAllMocks()
})

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('GET /(office)/jobs/[id]/packet', () => {
  it('returns the PDF buffer with application/pdf and inline disposition', async () => {
    ;(generatePacketPdf as ReturnType<typeof vi.fn>).mockResolvedValue({
      pdf: SAMPLE_PDF,
      job_number: 'POPS-2026-00042',
      packet_token: 'abcdefghijklmnop',
    })

    const res = await GET(new Request('http://localhost/jobs/x/packet'), makeParams(JOB_ID))

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/pdf')
    expect(res.headers.get('Content-Length')).toBe(String(SAMPLE_PDF.byteLength))
    expect(res.headers.get('Content-Disposition')).toBe(
      'inline; filename="packet-POPS-2026-00042.pdf"'
    )
    expect(res.headers.get('Cache-Control')).toContain('no-store')

    const body = Buffer.from(await res.arrayBuffer())
    expect(body.equals(SAMPLE_PDF)).toBe(true)
  })

  it('forwards job_id from route params', async () => {
    ;(generatePacketPdf as ReturnType<typeof vi.fn>).mockResolvedValue({
      pdf: SAMPLE_PDF,
      job_number: 'POPS-2026-00042',
      packet_token: 'abcdefghijklmnop',
    })

    await GET(new Request('http://x'), makeParams(JOB_ID))
    expect(generatePacketPdf).toHaveBeenCalledWith({ job_id: JOB_ID })
  })

  it('returns 404 when generatePacketPdf throws "Job not found"', async () => {
    ;(generatePacketPdf as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Job not found'))
    const res = await GET(new Request('http://x'), makeParams(JOB_ID))
    expect(res.status).toBe(404)
    expect(await res.text()).toBe('Job not found')
  })

  it('returns 404 when generatePacketPdf throws "Invalid input"', async () => {
    ;(generatePacketPdf as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Invalid input'))
    const res = await GET(new Request('http://x'), makeParams('not-uuid'))
    expect(res.status).toBe(404)
  })

  it('returns 500 with the underlying message for other errors', async () => {
    ;(generatePacketPdf as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('rls denied'))
    const res = await GET(new Request('http://x'), makeParams(JOB_ID))
    expect(res.status).toBe(500)
    expect(await res.text()).toBe('Packet generation failed: rls denied')
  })
})
