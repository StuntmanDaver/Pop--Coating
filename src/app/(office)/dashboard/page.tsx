import { Suspense } from 'react'
import { requireOfficeStaff } from '@/shared/auth-helpers'
import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import { MetricsRow } from './_components/metrics-row'
import { RecentJobsCard } from './_components/recent-jobs-card'
import { ActiveWorkstationsCard } from './_components/active-workstations-card'

export const dynamic = 'force-dynamic'

function MetricsRowSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="h-4 w-24 animate-pulse rounded bg-border" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-12 animate-pulse rounded bg-border" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function PanelSkeleton({ colSpan = 1 }: { colSpan?: number }) {
  return (
    <Card className={colSpan === 2 ? 'md:col-span-2' : undefined} aria-hidden="true">
      <CardHeader>
        <div className="h-5 w-40 animate-pulse rounded bg-border" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-border/70" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  await requireOfficeStaff()

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of current shop operations.</p>
      </header>

      <Suspense fallback={<MetricsRowSkeleton />}>
        <MetricsRow />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-3">
        <Suspense fallback={<PanelSkeleton colSpan={2} />}>
          <RecentJobsCard />
        </Suspense>
        <Suspense fallback={<PanelSkeleton />}>
          <ActiveWorkstationsCard />
        </Suspense>
      </div>
    </div>
  )
}
