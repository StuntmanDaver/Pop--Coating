'use client'

import { useEffect, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { recordWorkstationHeartbeat } from '@/modules/scanning'

const HEARTBEAT_INTERVAL_MS = 30_000

interface HeartbeatProviderProps {
  children: React.ReactNode
}

export function HeartbeatProvider({ children }: HeartbeatProviderProps) {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => {
      startTransition(() => {
        recordWorkstationHeartbeat().catch(() => {
          // Auth failure (401/403) means session expired — clear and redirect
          router.replace('/scan')
        })
      })
    }, HEARTBEAT_INTERVAL_MS)

    return () => clearInterval(id)
  }, [router])

  return <>{children}</>
}
