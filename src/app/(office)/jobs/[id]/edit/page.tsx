import { notFound } from 'next/navigation'
import { getJobById } from '@/modules/jobs'
import { listCompanies } from '@/modules/crm'
import { EditJobForm } from './edit-job-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditJobPage({ params }: PageProps) {
  const { id } = await params
  const [job, companies] = await Promise.all([
    getJobById({ id }),
    listCompanies({ include_archived: false, limit: 200, offset: 0 }),
  ])

  if (!job) notFound()

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          {job.job_number}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Edit job</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Editing any printed field marks the packet as needing reprint.
        </p>
      </header>

      <EditJobForm
        jobId={job.id}
        companies={companies.map((c) => ({ id: c.id, name: c.name }))}
        currentIntakeStatus={job.intake_status}
        // intake_status is only included in defaults when it's a value the form's
        // <select> can safely write back. 'in_production' is excluded — the form's
        // options are draft/scheduled/archived, and showing 'draft' selected for an
        // in_production job would silently propose a downgrade. With undefined here,
        // JobFormFields shows 'draft' as the visual default but the action layer
        // only sends fields the user actually changed (any-key-with-undefined is
        // dropped by Object.fromEntries(...).filter(([,v]) => v !== undefined)).
        defaults={{
          company_id: job.company_id,
          job_name: job.job_name,
          description: job.description,
          customer_po_number: job.customer_po_number,
          part_count: job.part_count,
          weight_lbs: job.weight_lbs,
          dimensions_text: job.dimensions_text,
          color: job.color,
          coating_type: job.coating_type,
          due_date: job.due_date,
          priority: job.priority as 'low' | 'normal' | 'high' | 'rush',
          intake_status: (['draft', 'scheduled', 'archived'] as const).includes(
            job.intake_status as 'draft' | 'scheduled' | 'archived'
          )
            ? (job.intake_status as 'draft' | 'scheduled' | 'archived')
            : undefined,
          notes: job.notes,
        }}
      />
    </div>
  )
}
