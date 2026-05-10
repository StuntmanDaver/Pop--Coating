import Link from 'next/link'
import { getRecentJobs } from '@/modules/dashboard'
import type { RecentJob } from '@/modules/dashboard'
import { PRODUCTION_LABEL, INTAKE_LABEL, PRIORITY_VARIANT } from '@/modules/jobs'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Badge } from '@/shared/ui/badge'
import { ListTodo, ArrowRight } from 'lucide-react'

function StatusBadge({ job }: { job: RecentJob }) {
  if (job.on_hold) return <Badge variant="warning">On hold</Badge>
  if (job.production_status) {
    return <Badge variant="default">{PRODUCTION_LABEL[job.production_status] ?? job.production_status}</Badge>
  }
  return <Badge variant="muted">{INTAKE_LABEL[job.intake_status] ?? job.intake_status}</Badge>
}

export async function RecentJobsCard() {
  const jobs = await getRecentJobs(8)

  return (
    <Card className="md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <ListTodo className="h-5 w-5" aria-hidden="true" />
          Recent jobs
          {jobs.length > 0 && <span className="text-sm font-normal text-muted-foreground">({jobs.length})</span>}
        </CardTitle>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1 text-sm font-medium text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No recent jobs.
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
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
                        className="font-mono text-xs text-link underline-offset-4 hover:underline"
                      >
                        {job.job_number}
                      </Link>
                      <div className="mt-0.5 max-w-[200px] truncate text-xs text-muted-foreground">
                        {job.job_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge job={job} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={PRIORITY_VARIANT[job.priority] ?? 'default'} className="capitalize">
                        {job.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-muted-foreground">
                      {job.due_date ?? '—'}
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
