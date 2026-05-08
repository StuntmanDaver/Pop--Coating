// src/shared/storage/index.ts
import 'server-only'

import { z } from 'zod'
import { createClient } from '@/shared/db/server'

const SignedUrlInputSchema = z.object({
  bucket: z.string().min(1),
  path: z.string().min(1),
  expiresInSeconds: z.number().int().min(60).max(60 * 60 * 24).default(60 * 10),
})

export type SignedUrlInput = z.input<typeof SignedUrlInputSchema>

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 60 * 10
): Promise<string> {
  const parsed = SignedUrlInputSchema.parse({ bucket, path, expiresInSeconds })
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from(parsed.bucket)
    .createSignedUrl(parsed.path, parsed.expiresInSeconds)

  if (error) {
    throw new Error(`Signed URL creation failed: ${error.message}`)
  }

  return data.signedUrl
}
