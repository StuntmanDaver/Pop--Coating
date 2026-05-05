'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

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
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <div className="rounded-lg border border-dashed border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="text-sm text-destructive">
          Something went wrong loading the dashboard.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
