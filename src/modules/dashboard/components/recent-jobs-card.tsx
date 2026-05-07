import Link from 'next/link'
import { ArrowRight, CalendarClock, ListTodo } from 'lucide-react'
import { INTAKE_LABEL, PRIORITY_VARIANT, PRODUCTION_LABEL } from '@/modules/jobs'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import type { RecentJob } from '../queries/dashboard'

function StatusBadge({ job }: { job: RecentJob }) {
  if (job.on_hold) return <Badge variant="warning">On hold</Badge>
  if (job.production_status) {
    return <Badge variant="default">{PRODUCTION_LABEL[job.production_status] ?? job.production_status}</Badge>
  }
  return <Badge variant="muted">{INTAKE_LABEL[job.intake_status] ?? job.intake_status}</Badge>
}

function formatDueDate(dueDate: string | null) {
  if (!dueDate) return 'No date'

  const [year, month, day] = dueDate.split('-').map(Number)
  if (!year || !month || !day) return dueDate

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

type Props = {
  jobs: RecentJob[]
}

export function RecentJobsCard({ jobs }: Props) {
  return (
    <Card className="rounded-md">
      <CardHeader className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListTodo className="h-4 w-4 text-primary" aria-hidden="true" />
            Recent jobs
            {jobs.length > 0 && <span className="text-sm font-normal text-muted-foreground">({jobs.length})</span>}
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">Newest open work with intake and production status.</p>
        </div>
        <Link
          href="/jobs"
          className="inline-flex w-fit items-center gap-1 rounded-sm text-sm font-medium text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {jobs.length === 0 ? (
          <div className="m-5 rounded-md border border-dashed border-border p-8 text-center">
            <p className="text-sm font-medium">No open jobs yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Newly created jobs will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Job</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-mono text-xs font-semibold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        {job.job_number}
                      </Link>
                      <div className="mt-1 max-w-[260px] truncate text-xs text-muted-foreground">{job.job_name}</div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge job={job} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={PRIORITY_VARIANT[job.priority] ?? 'default'} className="capitalize">
                        {job.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-sm text-muted-foreground">
                      <span className="inline-flex items-center justify-end gap-1">
                        <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatDueDate(job.due_date)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
