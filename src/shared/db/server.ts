// src/shared/db/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createClient() {
  const cookieStore = await cookies() // MUST be awaited in Next.js 16

  return createServerClient<Database>(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- env vars validated at build; missing vars caught by Next.js config validation
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- env vars validated at build; missing vars caught by Next.js config validation
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component context — mutations ignored; only proxy.ts mutates
          }
        },
      },
    }
  )
}
