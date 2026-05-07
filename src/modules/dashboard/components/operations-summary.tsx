import { Activity, AlertTriangle, CheckCircle2, ScanLine } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import type { ActiveWorkstation, DashboardCounts, RecentJob } from '../queries/dashboard'
import { RelativeTime } from './relative-time'

type Props = {
  counts: DashboardCounts
  jobs: RecentJob[]
  stations: ActiveWorkstation[]
  now: Date
}

function getLatestActivity(stations: ActiveWorkstation[]) {
  return stations.find((station) => station.last_activity_at)?.last_activity_at ?? null
}

export function OperationsSummary({ counts, jobs, stations, now }: Props) {
  const jobsWithScanStatus = jobs.filter((job) => job.production_status !== null).length
  const heldOrOverdue = counts.jobs_on_hold + counts.jobs_overdue
  const latestActivity = getLatestActivity(stations)

  return (
    <Card className="rounded-md">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <ScanLine className="h-4 w-4 text-primary" aria-hidden="true" />
          Scan and status visibility
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-0 p-0 md:grid-cols-3">
        <div className="border-b border-border p-5 md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Active scan stations
          </div>
          <p className="mt-3 text-2xl font-semibold tabular-nums">{stations.length}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Last heartbeat <RelativeTime iso={latestActivity} now={now} />
          </p>
        </div>
        <div className="border-b border-border p-5 md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Recent jobs with stage
          </div>
          <p className="mt-3 text-2xl font-semibold tabular-nums">
            {jobsWithScanStatus}
            <span className="text-sm font-medium text-muted-foreground"> / {jobs.length}</span>
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Recent job rows carrying scan status.</p>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Attention queue
          </div>
          <p className="mt-3 text-2xl font-semibold tabular-nums">{heldOrOverdue}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Held or overdue jobs to clear first.</p>
        </div>
      </CardContent>
    </Card>
  )
}
