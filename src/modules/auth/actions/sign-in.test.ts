import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signInStaff } from './sign-in'

// Mock dependencies
vi.mock('@/shared/db/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/shared/rate-limit', () => ({
  signInLimiter: {
    limit: vi.fn(),
  },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}))

import { createClient } from '@/shared/db/server'
import { signInLimiter } from '@/shared/rate-limit'
import { headers } from 'next/headers'

const mockSignInWithPassword = vi.fn()
const mockSupabase = {
  auth: {
    signInWithPassword: mockSignInWithPassword,
  },
}

const mockHeaders = {
  get: vi.fn().mockReturnValue('127.0.0.1'),
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase)
  ;(headers as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders)
  ;(signInLimiter.limit as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true })
})

describe('signInStaff', () => {
  it('calls signInWithPassword and returns success for valid credentials with rate limit allowed', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })

    const result = await signInStaff({ email: 'staff@example.com', password: 'securepassword123' })

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'staff@example.com',
      password: 'securepassword123',
    })
    expect(result).toEqual({ success: true })
  })

  it('returns error for missing email (invalid Zod input) without calling Supabase', async () => {
    const result = await signInStaff({ password: 'securepassword123' })

    expect(result).toEqual({ error: 'Invalid input' })
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it('returns error for missing password (invalid Zod input) without calling Supabase', async () => {
    const result = await signInStaff({ email: 'staff@example.com' })

    expect(result).toEqual({ error: 'Invalid input' })
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it('returns error for password shorter than 8 chars (invalid Zod input) without calling Supabase', async () => {
    const result = await signInStaff({ email: 'staff@example.com', password: 'short' })

    expect(result).toEqual({ error: 'Invalid input' })
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it('returns rate limit error when limit exceeded WITHOUT calling signInWithPassword', async () => {
    ;(signInLimiter.limit as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false })

    const result = await signInStaff({ email: 'staff@example.com', password: 'securepassword123' })

    expect(result).toEqual({ error: 'Too many attempts. Try again later.' })
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it('returns anti-enumeration error when Supabase returns an auth error', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials', status: 400 },
    })

    const result = await signInStaff({ email: 'staff@example.com', password: 'securepassword123' })

    expect(result).toEqual({
      error: 'The email or password you entered is not correct. Please try again.',
    })
    // Critical: raw Supabase error message must NOT be exposed
    expect(result).not.toMatchObject({ error: expect.stringContaining('Invalid login credentials') })
  })

  it('returns anti-enumeration error when email does not exist (Supabase returns error)', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'User not found', status: 400 },
    })

    const result = await signInStaff({ email: 'notexist@example.com', password: 'securepassword123' })

    // Must NOT distinguish "user not found" from "wrong password"
    expect(result).toEqual({
      error: 'The email or password you entered is not correct. Please try again.',
    })
  })
})
