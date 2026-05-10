import { generatePacketPdf } from '@/modules/packets'

// GET /jobs/[id]/packet — streams the printable PDF packet for a job.
//
// Auth + RLS:
//   - generatePacketPdf calls requireOfficeStaff() internally (audience gate)
//   - Job lookup is bounded by RLS to the caller's tenant
//   - 404 surfaces as "Job not found" thrown error → 500 here; refine later
//     once we have a shared http-error mapper.
//
// Side effect: clears jobs.packet_dirty after successful render.

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteParams): Promise<Response> {
  const { id } = await params

  let result: Awaited<ReturnType<typeof generatePacketPdf>>
  try {
    result = await generatePacketPdf({ job_id: id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    // Auth-helper redirects throw NEXT_REDIRECT — Next intercepts, never reaches us.
    // Anything else here is a real failure (job not found, RLS denial, render error).
    if (message.includes('not found') || message.includes('Invalid input')) {
      return new Response(message, { status: 404 })
    }
    return new Response(`Packet generation failed: ${message}`, { status: 500 })
  }

  return new Response(new Uint8Array(result.pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(result.pdf.byteLength),
      'Content-Disposition': `inline; filename="packet-${result.job_number}.pdf"`,
      // Packet content reflects DB state at render time; don't cache.
      'Cache-Control': 'private, no-store, must-revalidate',
    },
  })
}
