import Link from 'next/link'
import { getActiveWorkstations, getDashboardCounts, getRecentJobs } from '../queries/dashboard'
import { ActiveWorkstationsCard } from './active-workstations-card'
import { MetricsRow } from './metrics-row'
import { OperationsSummary } from './operations-summary'
import { RecentJobsCard } from './recent-jobs-card'

export async function DashboardPage() {
  const now = new Date()
  const [counts, jobs, stations] = await Promise.all([
    getDashboardCounts(),
    getRecentJobs(8),
    getActiveWorkstations(),
  ])

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Office operations</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Shop dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Production status, scan activity, and work needing attention.</p>
        </div>
        <Link
          href="/jobs/new"
          className="inline-flex h-9 w-fit items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          New job
        </Link>
      </header>

      <MetricsRow counts={counts} />
      <OperationsSummary counts={counts} jobs={jobs} stations={stations} now={now} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <RecentJobsCard jobs={jobs} />
        <ActiveWorkstationsCard stations={stations} now={now} />
      </div>
    </div>
  )
}
