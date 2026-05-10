import type { Route } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getMyJob,
  getCustomerVisibleTimeline,
  type TimelineEvent,
} from '@/modules/portal'
import { PRODUCTION_LABEL } from '@/modules/jobs'
import { requireCustomer } from '@/shared/auth-helpers'
import { Badge } from '@/shared/ui/badge'

interface PageProps {
  params: Promise<{ jobId: string }>
}

export default async function PortalJobDetailPage({ params }: PageProps) {
  await requireCustomer()
  const { jobId } = await params

  const job = await getMyJob({ id: jobId })
  if (!job) notFound()

  const events = await getCustomerVisibleTimeline({ job_id: jobId })

  const productionLabel = job.production_status
    ? PRODUCTION_LABEL[job.production_status] ?? job.production_status
    : null

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6 sm:p-8">
      <Link
        href={'/my' as Route}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span aria-hidden="true">←</span> Your jobs
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {job.job_number}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{job.job_name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {productionLabel ? (
              <Badge variant="default">{productionLabel}</Badge>
            ) : (
              <Badge variant="muted">{humanize(job.intake_status)}</Badge>
            )}
            {job.on_hold ? (
              <Badge variant="warning">
                On hold{job.hold_reason ? ` — ${job.hold_reason}` : ''}
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
          <Field label="Status" value={productionLabel} />
          <Field label="Stage" value={humanize(job.intake_status)} />
          <Field label="PO #" value={job.customer_po_number} />
          <Field label="Color" value={job.color} />
          <Field label="Due date" value={job.due_date} />
          <Field
            label="Created"
            value={new Date(job.created_at).toLocaleDateString()}
          />
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
            No updates yet — your job has been received and is queued for production.
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
  const fromLabel = event.from_status
    ? PRODUCTION_LABEL[event.from_status] ?? humanize(event.from_status)
    : null
  const toLabel = event.to_status
    ? PRODUCTION_LABEL[event.to_status] ?? humanize(event.to_status)
    : null
  const headline =
    fromLabel && toLabel
      ? `${fromLabel} → ${toLabel}`
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
          {new Date(event.scanned_at).toLocaleString()}
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

function humanize(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
