'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/shared/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Office operations</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Shop dashboard</h1>
      </header>
      <div className="rounded-md border border-dashed border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="text-sm font-medium text-destructive">Something went wrong loading the dashboard.</p>
        <Button type="button" variant="outline" className="mt-4" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  )
}
