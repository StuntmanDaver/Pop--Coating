import Link from 'next/link'
import { listJobs, PRODUCTION_LABEL, PRIORITY_VARIANT } from '@/modules/jobs'
import type { ListJobsParams } from '@/modules/jobs'
import { Badge } from '@/shared/ui/badge'

interface PageProps {
  searchParams: Promise<{
    q?: string
    intake_status?: string
    production_status?: string
    on_hold?: string
  }>
}

export default async function JobsListPage({ searchParams }: PageProps) {
  const params = await searchParams

  const listParams: ListJobsParams = {
    q: params.q,
    intake_status: params.intake_status as ListJobsParams['intake_status'],
    production_status: params.production_status as ListJobsParams['production_status'],
    on_hold: params.on_hold === 'true' ? true : params.on_hold === 'false' ? false : undefined,
    include_archived: false,
    limit: 100,
    offset: 0,
  }

  const jobs = await listJobs(listParams)

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {jobs.length === 0
              ? 'No active jobs match these filters.'
              : `${jobs.length} active ${jobs.length === 1 ? 'job' : 'jobs'}.`}
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          New job
        </Link>
      </header>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <div className="grow min-w-[16rem]">
          <label htmlFor="q" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Search
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={params.q ?? ''}
            placeholder="Job number or name"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <FilterSelect name="intake_status" label="Intake" value={params.intake_status} options={['draft', 'scheduled', 'in_production']} />
        <FilterSelect name="production_status" label="Stage" value={params.production_status} options={Object.keys(PRODUCTION_LABEL)} />
        <FilterSelect name="on_hold" label="Hold" value={params.on_hold} options={['true', 'false']} placeholder="Any" />
        <button
          type="submit"
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
        >
          Apply
        </button>
      </form>

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-16 text-center">
          <p className="text-sm text-muted-foreground">
            No jobs yet. <Link href="/jobs/new" className="text-link underline-offset-4 hover:underline">Create the first one</Link>.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/5">
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-4 py-3 font-medium">Number</th>
                <th scope="col" className="px-4 py-3 font-medium">Name</th>
                <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                <th scope="col" className="px-4 py-3 font-medium">Stage</th>
                <th scope="col" className="px-4 py-3 font-medium">Priority</th>
                <th scope="col" className="px-4 py-3 font-medium">Due</th>
                <th scope="col" className="px-4 py-3 font-medium">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-muted/5">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                    <Link href={`/jobs/${job.id}`} className="text-link underline-offset-4 hover:underline">
                      {job.job_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/jobs/${job.id}`} className="font-medium text-foreground hover:underline">
                      {job.job_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{job.company_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {job.production_status ? (
                      <Badge variant="default">{PRODUCTION_LABEL[job.production_status] ?? job.production_status}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">{job.intake_status}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={PRIORITY_VARIANT[job.priority] ?? 'default'}>{job.priority}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{job.due_date ?? '—'}</td>
                  <td className="px-4 py-3">
                    {job.on_hold ? <Badge variant="warning">On hold</Badge> : <Badge variant="muted">Active</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FilterSelect({
  name,
  label,
  value,
  options,
  placeholder = 'All',
}: {
  name: string
  label: string
  value: string | undefined
  options: string[]
  placeholder?: string
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={value ?? ''}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}
