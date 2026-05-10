// src/shared/db/admin.ts
// SERVICE-ROLE CLIENT — bypasses RLS. Imports gated by eslint.config.js (Plan 01).
// Allowed: src/modules/{settings,portal,auth}/**, src/shared/audit/**, supabase/functions/**.
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export function createServiceClient() {
  return createClient<Database>(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- env vars validated at build; missing vars caught by Next.js config validation
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- env vars validated at build; missing vars caught by Next.js config validation
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
