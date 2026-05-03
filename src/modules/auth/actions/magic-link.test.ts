import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requestCustomerMagicLink } from './magic-link'

// Mock dependencies
vi.mock('@/shared/db/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/shared/rate-limit', () => ({
  magicLinkPerEmailLimiter: {
    limit: vi.fn(),
  },
  magicLinkPerIpLimiter: {
    limit: vi.fn(),
  },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}))

import { createClient } from '@/shared/db/server'
import { magicLinkPerEmailLimiter, magicLinkPerIpLimiter } from '@/shared/rate-limit'
import { headers } from 'next/headers'

const mockSignInWithOtp = vi.fn()
const mockSupabase = {
  auth: {
    signInWithOtp: mockSignInWithOtp,
  },
}

const mockHeaders = {
  get: vi.fn().mockReturnValue('127.0.0.1'),
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase)
  ;(headers as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders)
  ;(magicLinkPerEmailLimiter.limit as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true })
  ;(magicLinkPerIpLimiter.limit as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true })
  mockSignInWithOtp.mockResolvedValue({ data: {}, error: null })
})

describe('requestCustomerMagicLink', () => {
  it('calls signInWithOtp with redirectTo callback and returns success for valid email', async () => {
    const result = await requestCustomerMagicLink({ email: 'customer@example.com' })

    expect(mockSignInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'customer@example.com',
        options: expect.objectContaining({
          shouldCreateUser: false,
          emailRedirectTo: expect.stringContaining('/auth/callback'),
        }),
      })
    )
    expect(result).toEqual({ success: true })
  })

  it('returns success even when email is inactive/non-existent (anti-enumeration per DESIGN.md §5.5)', async () => {
    // Simulate Supabase returning error for non-existent email
    mockSignInWithOtp.mockResolvedValue({
      data: {},
      error: { message: 'Email not found', status: 422 },
    })

    const result = await requestCustomerMagicLink({ email: 'inactive@example.com' })

    // MUST always return success regardless
    expect(result).toEqual({ success: true })
  })

  it('returns success even when email rate limit is exceeded (anti-enumeration)', async () => {
    ;(magicLinkPerEmailLimiter.limit as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false })

    const result = await requestCustomerMagicLink({ email: 'customer@example.com' })

    // Anti-enumeration: must NOT leak rate-limit info
    expect(result).toEqual({ success: true })
  })

  it('returns success even when IP rate limit is exceeded (anti-enumeration)', async () => {
    ;(magicLinkPerIpLimiter.limit as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false })

    const result = await requestCustomerMagicLink({ email: 'customer@example.com' })

    expect(result).toEqual({ success: true })
  })

  it('returns error for invalid email format (invalid Zod input)', async () => {
    const result = await requestCustomerMagicLink({ email: 'not-an-email' })

    expect(result).toEqual({ error: 'Invalid input' })
    expect(mockSignInWithOtp).not.toHaveBeenCalled()
  })

  it('returns error when email field is missing (invalid Zod input)', async () => {
    const result = await requestCustomerMagicLink({})

    expect(result).toEqual({ error: 'Invalid input' })
    expect(mockSignInWithOtp).not.toHaveBeenCalled()
  })

  it('uses shouldCreateUser: false to prevent auto-creating customer accounts', async () => {
    await requestCustomerMagicLink({ email: 'customer@example.com' })

    expect(mockSignInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          shouldCreateUser: false,
        }),
      })
    )
  })
})
