import type { Route } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getJobById } from '@/modules/jobs'
import { Badge } from '@/shared/ui/badge'

const PRODUCTION_LABEL: Record<string, string> = {
  received: 'Received',
  prep: 'Prep',
  coating: 'Coating',
  curing: 'Curing',
  qc: 'QC',
  completed: 'Completed',
  picked_up: 'Picked up',
}

const PRIORITY_VARIANT: Record<string, 'default' | 'warning' | 'danger' | 'muted'> = {
  rush: 'danger',
  high: 'warning',
  normal: 'default',
  low: 'muted',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params
  const job = await getJobById({ id })
  if (!job) notFound()

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {job.job_number}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{job.job_name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {job.production_status ? (
              <Badge variant="default">{PRODUCTION_LABEL[job.production_status] ?? job.production_status}</Badge>
            ) : (
              <Badge variant="muted">{job.intake_status}</Badge>
            )}
            <Badge variant={PRIORITY_VARIANT[job.priority] ?? 'default'}>{job.priority}</Badge>
            {job.on_hold ? <Badge variant="warning">On hold — {job.hold_reason ?? 'no reason'}</Badge> : null}
            {job.packet_dirty ? <Badge variant="warning">Packet needs reprint</Badge> : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/jobs/${job.id}/packet` as Route}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
          >
            Print packet
          </Link>
          <Link
            href={`/jobs/${job.id}/edit` as Route}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Edit
          </Link>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-lg border border-border bg-card p-6">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Job details
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Field label="PO #" value={job.customer_po_number} />
            <Field label="Color" value={job.color} />
            <Field label="Coating" value={job.coating_type} />
            <Field label="Parts" value={job.part_count?.toString() ?? null} />
            <Field label="Weight" value={job.weight_lbs != null ? `${job.weight_lbs} lbs` : null} />
            <Field label="Dimensions" value={job.dimensions_text} />
            <Field label="Due date" value={job.due_date} />
            <Field label="Created" value={new Date(job.created_at).toLocaleDateString()} />
          </dl>
          {job.description ? (
            <div className="mt-6 border-t border-border pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Description
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{job.description}</p>
            </div>
          ) : null}
          {job.notes ? (
            <div className="mt-6 border-t border-border pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Notes
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{job.notes}</p>
            </div>
          ) : null}
        </section>

        <aside className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Packet
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Manual entry code:
          </p>
          <p className="mt-1 font-mono text-xl tracking-widest">
            {job.packet_token.slice(-8).toUpperCase()}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Workstation operators can scan the QR code on the printed packet, or enter the
            8-character code manually if the QR is damaged.
          </p>
        </aside>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value ?? <span className="text-muted-foreground">—</span>}</dd>
    </>
  )
}
