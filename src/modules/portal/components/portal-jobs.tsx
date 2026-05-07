import type { Route } from 'next'
import Link from 'next/link'
import { INTAKE_LABEL, PRODUCTION_LABEL } from '@/modules/jobs'
import type { TimelineEvent } from '@/modules/timeline'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import type { PortalJobDetail, PortalJobListItem } from '../queries/portal'

type PortalJobsListProps = {
  jobs: PortalJobListItem[]
}

export function PortalJobsList({ jobs }: PortalJobsListProps) {
  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6 sm:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Customer portal
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your Jobs</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {jobs.length === 0
              ? 'No active jobs are currently visible in your portal.'
              : `${jobs.length} active ${jobs.length === 1 ? 'job' : 'jobs'} visible to your account.`}
          </p>
        </div>
      </header>

      {jobs.length === 0 ? <PortalJobsEmptyState /> : <PortalJobsTable jobs={jobs} />}
    </main>
  )
}

function PortalJobsEmptyState() {
  return (
    <section
      aria-labelledby="empty-jobs-heading"
      className="rounded-lg border border-dashed border-border bg-card p-10 text-center sm:p-16"
    >
      <h2 id="empty-jobs-heading" className="text-lg font-semibold">
        No visible jobs yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Jobs appear here after the shop makes them visible to your customer account.
        Contact the shop if you expected to see an active order.
      </p>
    </section>
  )
}

function PortalJobsTable({ jobs }: { jobs: PortalJobListItem[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/10">
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="px-4 py-3 font-medium">
                Job
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Status
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Due
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                State
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-muted/10">
                <td className="min-w-64 px-4 py-4">
                  <Link
                    href={`/my/${job.id}` as Route}
                    className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {job.job_name}
                  </Link>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {job.job_number}
                  </p>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <StatusBadge
                    intakeStatus={job.intake_status}
                    productionStatus={job.production_status}
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                  {formatDate(job.due_date)}
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  {job.on_hold ? (
                    <Badge variant="warning">On hold</Badge>
                  ) : (
                    <Badge variant="muted">Active</Badge>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                  {formatDate(job.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type PortalJobDetailViewProps = {
  job: PortalJobDetail
  events: TimelineEvent[]
}

export function PortalJobDetailView({ job, events }: PortalJobDetailViewProps) {
  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6 sm:p-8">
      <Button asChild variant="ghost" className="px-0 text-muted-foreground hover:text-foreground">
        <Link href={'/my' as Route}>
          <span aria-hidden="true">←</span>
          Your jobs
        </Link>
      </Button>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {job.job_number}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{job.job_name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge
              intakeStatus={job.intake_status}
              productionStatus={job.production_status}
            />
            {job.on_hold ? (
              <Badge variant="warning">
                On hold{job.hold_reason ? ` - ${job.hold_reason}` : ''}
              </Badge>
            ) : null}
          </div>
        </div>
      </header>

      <section
        aria-labelledby="job-details-heading"
        className="rounded-lg border border-border bg-card p-6"
      >
        <h2
          id="job-details-heading"
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          Job details
        </h2>
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <Field label="Status" value={getStatusLabel(job.intake_status, job.production_status)} />
          <Field label="Stage" value={getIntakeLabel(job.intake_status)} />
          <Field label="PO #" value={job.customer_po_number} />
          <Field label="Color" value={job.color} />
          <Field label="Due date" value={formatDate(job.due_date)} />
          <Field label="Created" value={formatDate(job.created_at)} />
        </dl>
        {job.description ? (
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Description
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
              {job.description}
            </p>
          </div>
        ) : null}
      </section>

      <section
        aria-labelledby="timeline-heading"
        className="rounded-lg border border-border bg-card p-6"
      >
        <h2
          id="timeline-heading"
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          Timeline
        </h2>
        {events.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No customer-visible updates yet. Your job has been received and is queued
            for production.
          </p>
        ) : (
          <ol className="mt-4 space-y-4">
            {events.map((event) => (
              <TimelineRow key={event.id} event={event} />
            ))}
          </ol>
        )}
      </section>
    </main>
  )
}

function StatusBadge({
  intakeStatus,
  productionStatus,
}: {
  intakeStatus: string
  productionStatus: string | null
}) {
  const label = getStatusLabel(intakeStatus, productionStatus)
  const isComplete = productionStatus === 'completed' || productionStatus === 'picked_up'

  return (
    <Badge variant={isComplete ? 'success' : productionStatus ? 'default' : 'muted'}>
      {label}
    </Badge>
  )
}

function Field({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="contents">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-foreground">
        {value ?? <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  )
}

function TimelineRow({ event }: { event: TimelineEvent }) {
  const fromLabel = event.from_status ? getProductionLabel(event.from_status) : null
  const toLabel = event.to_status ? getProductionLabel(event.to_status) : null
  const headline =
    fromLabel && toLabel
      ? `${fromLabel} to ${toLabel}`
      : toLabel ?? humanize(event.event_type)

  return (
    <li className="border-l-2 border-border pl-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          {headline}
          {event.is_rework ? (
            <Badge variant="warning" className="ml-2">
              Rework
            </Badge>
          ) : null}
        </p>
        <time
          dateTime={event.scanned_at}
          className="font-mono text-xs text-muted-foreground"
        >
          {formatDateTime(event.scanned_at)}
        </time>
      </div>
      {event.notes ? (
        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
          {event.notes}
        </p>
      ) : null}
    </li>
  )
}

function getStatusLabel(intakeStatus: string, productionStatus: string | null) {
  return productionStatus ? getProductionLabel(productionStatus) : getIntakeLabel(intakeStatus)
}

function getProductionLabel(value: string) {
  return PRODUCTION_LABEL[value] ?? humanize(value)
}

function getIntakeLabel(value: string) {
  return INTAKE_LABEL[value] ?? humanize(value)
}

function humanize(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
