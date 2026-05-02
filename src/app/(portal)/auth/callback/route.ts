import { createClient } from '@/shared/db/server'
import { NextResponse, type NextRequest } from 'next/server'

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

  // Redirect to portal home (Phase 4 builds the real /jobs page)
  return NextResponse.redirect(new URL('/', request.url))
}
