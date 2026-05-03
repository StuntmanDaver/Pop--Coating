'use server'
import { z } from 'zod'
import { headers } from 'next/headers'
import { createClient } from '@/shared/db/server'
import { signInLimiter } from '@/shared/rate-limit'
import type { SignInResult } from '../types'

const SignInSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
})

export async function signInStaff(input: unknown): Promise<SignInResult> {
  const parsed = SignInSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input' }

  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rlKey = `${ip}:${parsed.data.email}`

  const { success: rlOk } = await signInLimiter.limit(rlKey)
  if (!rlOk) return { error: 'Too many attempts. Try again later.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    // Anti-enumeration: do NOT reveal whether email exists or password is wrong
    return { error: 'The email or password you entered is not correct. Please try again.' }
  }
  return { success: true }
}
