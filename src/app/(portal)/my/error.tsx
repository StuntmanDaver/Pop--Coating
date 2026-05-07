'use client'

import { Button } from '@/shared/ui/button'

export default function CustomerJobsError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="mx-auto max-w-3xl p-6 sm:p-8">
      <section className="rounded-lg border border-border bg-card p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Jobs could not load</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Refresh the portal view. If the problem continues, contact Pops Industrial
          Coatings with the job number you expected to see.
        </p>
        <Button type="button" onClick={reset} className="mt-6">
          Try again
        </Button>
      </section>
    </main>
  )
}
