import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSignedUrl } from './index'

vi.mock('@/shared/db/server', () => ({ createClient: vi.fn() }))

import { createClient } from '@/shared/db/server'

const mockCreateSignedUrl = vi.fn()
const mockFrom = vi.fn(() => ({ createSignedUrl: mockCreateSignedUrl }))

beforeEach(() => {
  vi.clearAllMocks()
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
    storage: { from: mockFrom },
  })
  mockCreateSignedUrl.mockResolvedValue({
    data: { signedUrl: 'https://storage.test/signed' },
    error: null,
  })
})

describe('getSignedUrl', () => {
  it('creates a signed URL with the default 10 minute expiry', async () => {
    const signedUrl = await getSignedUrl(
      'attachments',
      'attachments/tenant/job/job-id/photo.jpg'
    )

    expect(mockFrom).toHaveBeenCalledWith('attachments')
    expect(mockCreateSignedUrl).toHaveBeenCalledWith(
      'attachments/tenant/job/job-id/photo.jpg',
      600
    )
    expect(signedUrl).toBe('https://storage.test/signed')
  })

  it('accepts a bounded custom expiry', async () => {
    await getSignedUrl('attachments', 'attachments/tenant/job/job-id/photo.jpg', 3600)

    expect(mockCreateSignedUrl).toHaveBeenCalledWith(
      'attachments/tenant/job/job-id/photo.jpg',
      3600
    )
  })

  it('rejects empty bucket or path input', async () => {
    await expect(getSignedUrl('', 'path')).rejects.toThrow()
    await expect(getSignedUrl('attachments', '')).rejects.toThrow()
    expect(mockCreateSignedUrl).not.toHaveBeenCalled()
  })

  it('surfaces Supabase Storage errors', async () => {
    mockCreateSignedUrl.mockResolvedValueOnce({
      data: null,
      error: { message: 'object not found' },
    })

    await expect(getSignedUrl('attachments', 'missing.jpg')).rejects.toThrow(
      'Signed URL creation failed: object not found'
    )
  })
})
