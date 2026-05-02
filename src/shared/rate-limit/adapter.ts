// src/shared/rate-limit/adapter.ts
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- env vars validated at build; missing vars caught by Next.js config validation
  url: process.env.UPSTASH_REDIS_REST_URL!,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- env vars validated at build; missing vars caught by Next.js config validation
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})
