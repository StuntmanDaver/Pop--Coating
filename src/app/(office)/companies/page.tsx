import type { Route } from 'next'
import Link from 'next/link'
import { listCompanies } from '@/modules/crm'
import type { ListCompaniesParams } from '@/modules/crm'
import { Badge } from '@/shared/ui/badge'

interface PageProps {
  searchParams: Promise<{
    q?: string
    include_archived?: string
  }>
}

export default async function CompaniesListPage({ searchParams }: PageProps) {
  const params = await searchParams
  const includeArchived = params.include_archived === 'true'

  const listParams: ListCompaniesParams = {
    q: params.q,
    include_archived: includeArchived,
    limit: 100,
    offset: 0,
  }

  const companies = await listCompanies(listParams)

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Companies</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {companies.length === 0
              ? 'No companies match these filters.'
              : `${companies.length} ${companies.length === 1 ? 'company' : 'companies'}.`}
          </p>
        </div>
        <Link
          href={'/companies/new' as Route}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          New company
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
            placeholder="Company name"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground/80">
            <input
              type="checkbox"
              name="include_archived"
              value="true"
              defaultChecked={includeArchived}
              className="h-4 w-4 rounded border-input"
            />
            Show archived
          </label>
        </div>
        <button
          type="submit"
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
        >
          Apply
        </button>
      </form>

      {companies.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-16 text-center">
          <p className="text-sm text-muted-foreground">
            No companies yet.{' '}
            <Link href={'/companies/new' as Route} className="text-link underline-offset-4 hover:underline">
              Add the first one
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/5">
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-4 py-3 font-medium">Name</th>
                <th scope="col" className="px-4 py-3 font-medium">Phone</th>
                <th scope="col" className="px-4 py-3 font-medium">Email</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-muted/5">
                  <td className="px-4 py-3">
                    <Link
                      href={`/companies/${c.id}` as Route}
                      className="font-medium text-foreground hover:underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    {c.archived_at ? (
                      <Badge variant="muted">Archived</Badge>
                    ) : (
                      <Badge variant="default">Active</Badge>
                    )}
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
