// pops-website has no middleware requirements.
// This file exists to prevent Turbopack from picking up the SaaS app's
// src/proxy.ts when building within the monorepo workspace.
import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
