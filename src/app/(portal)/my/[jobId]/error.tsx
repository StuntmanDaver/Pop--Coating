'use client'

import Link from 'next/link'
import { Button } from '@/shared/ui/button'

export default function PortalJobDetailError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="mx-auto max-w-3xl p-6 sm:p-8">
      <section className="rounded-lg border border-border bg-card p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Job could not load</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Refresh this job view or return to your job list.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/my">Back to jobs</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
