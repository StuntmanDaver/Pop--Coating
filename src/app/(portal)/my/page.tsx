import type { Route } from 'next'
import Link from 'next/link'
import { INTAKE_LABEL, PRODUCTION_LABEL } from '@/modules/jobs'
import { listMyJobs } from '@/modules/portal'
import type { ListMyJobsParams, PortalJobListItem } from '@/modules/portal'
import { Badge } from '@/shared/ui/badge'

const INTAKE_STATUS_FILTERS = ['draft', 'scheduled', 'in_production'] as const

interface PageProps {
  searchParams: Promise<{
    q?: string
    intake_status?: string
  }>
}

export default async function CustomerJobsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const intakeStatus = parseIntakeStatus(params.intake_status)
  const query = parseSearchQuery(params.q)

  const listParams: ListMyJobsParams = {
    q: query,
    intake_status: intakeStatus,
    limit: 100,
    offset: 0,
  }

  const jobs = await listMyJobs(listParams)

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6 sm:p-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Customer portal
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Your jobs</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {jobs.length === 0
            ? 'No active jobs match these filters.'
            : `${jobs.length} active ${jobs.length === 1 ? 'job' : 'jobs'}.`}
        </p>
      </header>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <div className="min-w-[16rem] grow">
          <label
            htmlFor="q"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Search
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={query ?? ''}
            placeholder="Job number or name"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <FilterSelect
          name="intake_status"
          label="Status"
          value={intakeStatus}
          options={INTAKE_STATUS_FILTERS}
        />
        <button
          type="submit"
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
        >
          Apply
        </button>
      </form>

      {jobs.length === 0 ? (
        <section className="rounded-lg border border-dashed border-border p-12 text-center">
          <h2 className="text-base font-medium">No jobs found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Try clearing the filters, or contact the shop if you expected to see a job here.
          </p>
        </section>
      ) : (
        <section aria-label="Jobs" className="grid gap-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </section>
      )}
    </main>
  )
}

function JobCard({ job }: { job: PortalJobListItem }) {
  const productionLabel = job.production_status
    ? PRODUCTION_LABEL[job.production_status] ?? humanize(job.production_status)
    : null

  return (
    <Link
      href={`/my/${job.id}` as Route}
      className="block rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {job.job_number}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">{job.job_name}</h2>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {productionLabel ? (
            <Badge variant="default">{productionLabel}</Badge>
          ) : (
            <Badge variant="muted">
              {INTAKE_LABEL[job.intake_status] ?? humanize(job.intake_status)}
            </Badge>
          )}
          {job.on_hold ? <Badge variant="warning">On hold</Badge> : null}
        </div>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <Field label="Due" value={formatDate(job.due_date)} />
        <Field label="Created" value={formatDate(job.created_at)} />
      </dl>
    </Link>
  )
}

function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string
  label: string
  value: string | undefined
  options: readonly string[]
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={value ?? ''}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {INTAKE_LABEL[option] ?? humanize(option)}
          </option>
        ))}
      </select>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-foreground">
        {value ?? <span className="text-muted-foreground">Not set</span>}
      </dd>
    </div>
  )
}

function formatDate(value: string | null): string | null {
  return value ? new Date(value).toLocaleDateString() : null
}

function humanize(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function parseIntakeStatus(value: string | undefined): ListMyJobsParams['intake_status'] {
  return INTAKE_STATUS_FILTERS.find((status) => status === value)
}

function parseSearchQuery(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed && trimmed.length <= 200 ? trimmed : undefined
}
