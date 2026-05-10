import { createClient } from '@/shared/db/server'
import { NextResponse, type NextRequest } from 'next/server'

const IMPLEMENTED_PORTAL_JOBS_ROUTE = '/my'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/sign-in?error=missing_code', request.url))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    // Anti-enumeration: generic error, no Supabase details exposed to client
    return NextResponse.redirect(new URL('/sign-in?error=invalid_link', request.url))
  }

  // DESIGN.md §5.5 targets /jobs after portal sign-in, but the current shipped
  // portal list/detail surface is /my and /my/[jobId]. Keep callback on an
  // implemented route until the /jobs aliases are added.
  return NextResponse.redirect(new URL(IMPLEMENTED_PORTAL_JOBS_ROUTE, request.url))
}
