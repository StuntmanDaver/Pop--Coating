import { NextResponse } from 'next/server'

export async function POST() {
  // Phase 1 stub. Resend webhook handler lands in Phase 2 (when transactional email is wired).
  return NextResponse.json({ ok: true })
}
