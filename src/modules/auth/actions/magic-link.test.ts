import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requestCustomerMagicLink } from './magic-link'

// Mock dependencies
vi.mock('@/shared/db/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/shared/db/admin', () => ({
  createServiceClient: vi.fn(),
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

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
  setTag: vi.fn(),
}))

import { createClient } from '@/shared/db/server'
import { createServiceClient } from '@/shared/db/admin'
import { magicLinkPerEmailLimiter, magicLinkPerIpLimiter } from '@/shared/rate-limit'
import { headers } from 'next/headers'

const TENANT_ID = '00000000-0000-0000-0000-000000000001'
const CUSTOMER_USER_ID = '11111111-1111-4111-8111-111111111111'

type QueryError = { message: string }
type QueryResult<T> = { data: T | null; error: QueryError | null }
type QueryValue = string | boolean
type TenantDomainLookup = { tenant_id: string }
type CustomerUserLookup = { id: string; tenant_id: string; email: string }

interface QueryChain<T> {
  select: (columns: string) => QueryChain<T>
  eq: (column: string, value: QueryValue) => QueryChain<T>
  maybeSingle: () => Promise<QueryResult<T>>
}

const mockSignInWithOtp = vi.fn()
const mockSupabase = {
  auth: {
    signInWithOtp: mockSignInWithOtp,
  },
}

const mockAdminFrom = vi.fn()
const mockHeaders = {
  get: vi.fn((name: string) => headerValues[name.toLowerCase()] ?? null),
}
let headerValues: Record<string, string>
let domainChain: QueryChain<TenantDomainLookup>
let customerChain: QueryChain<CustomerUserLookup>

function makeChain<T>(result: QueryResult<T>): QueryChain<T> {
  const chain: QueryChain<T> = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => result),
  }
  return chain
}

function activeCustomer(email = 'customer@example.com'): CustomerUserLookup {
  return { id: CUSTOMER_USER_ID, tenant_id: TENANT_ID, email }
}

function setCustomerLookup(result: QueryResult<CustomerUserLookup>) {
  customerChain = makeChain(result)
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase)
  ;(createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockAdminFrom })
  ;(headers as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders)
  ;(magicLinkPerEmailLimiter.limit as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true })
  ;(magicLinkPerIpLimiter.limit as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true })
  mockSignInWithOtp.mockResolvedValue({ data: {}, error: null })
  headerValues = {
    host: 'track.localhost:3000',
    'x-forwarded-for': '127.0.0.1',
    'x-forwarded-proto': 'http',
  }
  domainChain = makeChain({ data: { tenant_id: TENANT_ID }, error: null })
  customerChain = makeChain({ data: activeCustomer(), error: null })
  mockAdminFrom.mockImplementation((table: string) => {
    if (table === 'tenant_domains') return domainChain
    if (table === 'customer_users') return customerChain
    throw new Error(`Unexpected table ${table}`)
  })
})

describe('requestCustomerMagicLink', () => {
  it('calls signInWithOtp with the portal callback only for an active customer user', async () => {
    const result = await requestCustomerMagicLink({ email: 'customer@example.com' })

    expect(mockAdminFrom).toHaveBeenCalledWith('tenant_domains')
    expect(mockAdminFrom).toHaveBeenCalledWith('customer_users')
    expect(domainChain.eq).toHaveBeenCalledWith('host', 'track.localhost:3000')
    expect(domainChain.eq).toHaveBeenCalledWith('audience', 'customer')
    expect(customerChain.eq).toHaveBeenCalledWith('tenant_id', TENANT_ID)
    expect(customerChain.eq).toHaveBeenCalledWith('email', 'customer@example.com')
    expect(customerChain.eq).toHaveBeenCalledWith('is_active', true)
    expect(mockSignInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'customer@example.com',
        options: {
          shouldCreateUser: false,
          emailRedirectTo: 'http://track.localhost:3000/auth/callback',
        },
      })
    )
    expect(result).toEqual({ success: true })
  })

  it('returns success and does not call OTP for an unknown customer email', async () => {
    setCustomerLookup({ data: null, error: null })

    const result = await requestCustomerMagicLink({ email: 'unknown@example.com' })

    expect(result).toEqual({ success: true })
    expect(mockSignInWithOtp).not.toHaveBeenCalled()
  })

  it('returns success and does not call OTP for an inactive customer email', async () => {
    setCustomerLookup({ data: null, error: null })

    const result = await requestCustomerMagicLink({ email: 'inactive@example.com' })

    expect(result).toEqual({ success: true })
    expect(customerChain.eq).toHaveBeenCalledWith('is_active', true)
    expect(mockSignInWithOtp).not.toHaveBeenCalled()
  })

  it('returns success and does not call OTP for a staff-only email', async () => {
    setCustomerLookup({ data: null, error: null })

    const result = await requestCustomerMagicLink({ email: 'staff@example.com' })

    expect(result).toEqual({ success: true })
    expect(customerChain.eq).toHaveBeenCalledWith('email', 'staff@example.com')
    expect(mockSignInWithOtp).not.toHaveBeenCalled()
  })

  it('returns success and does not call OTP when the portal host is not tenant-mapped', async () => {
    domainChain = makeChain<TenantDomainLookup>({ data: null, error: null })

    const result = await requestCustomerMagicLink({ email: 'customer@example.com' })

    expect(result).toEqual({ success: true })
    expect(mockAdminFrom).toHaveBeenCalledWith('tenant_domains')
    expect(mockAdminFrom).not.toHaveBeenCalledWith('customer_users')
    expect(mockSignInWithOtp).not.toHaveBeenCalled()
  })

  it('returns success even when email rate limit is exceeded (anti-enumeration)', async () => {
    ;(magicLinkPerEmailLimiter.limit as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false })

    const result = await requestCustomerMagicLink({ email: 'customer@example.com' })

    // Anti-enumeration: must NOT leak rate-limit info
    expect(result).toEqual({ success: true })
    expect(createServiceClient).not.toHaveBeenCalled()
    expect(mockSignInWithOtp).not.toHaveBeenCalled()
  })

  it('returns success even when IP rate limit is exceeded (anti-enumeration)', async () => {
    ;(magicLinkPerIpLimiter.limit as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false })

    const result = await requestCustomerMagicLink({ email: 'customer@example.com' })

    expect(result).toEqual({ success: true })
    expect(createServiceClient).not.toHaveBeenCalled()
    expect(mockSignInWithOtp).not.toHaveBeenCalled()
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
