// src/shared/db/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- env vars validated at build; missing vars caught by Next.js config validation
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- env vars validated at build; missing vars caught by Next.js config validation
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
