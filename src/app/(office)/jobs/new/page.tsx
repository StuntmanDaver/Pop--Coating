import { listCompanies } from '@/modules/crm'
import { NewJobForm } from './new-job-form'

export default async function NewJobPage() {
  const companies = await listCompanies({ include_archived: false, limit: 200, offset: 0 })

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">New job</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Job number is generated automatically when the job is created.
        </p>
      </header>

      {companies.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-16 text-center">
          <p className="text-sm text-muted-foreground">
            No customers yet — add a customer before creating jobs.
          </p>
        </div>
      ) : (
        <NewJobForm companies={companies.map((c) => ({ id: c.id, name: c.name }))} />
      )}
    </div>
  )
}
