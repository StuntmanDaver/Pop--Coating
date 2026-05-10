'use client'
import type { Route } from 'next'
import { useActionState } from 'react'
import Link from 'next/link'
import { JobFormFields, type JobFormCompany, type JobFormDefaults } from '../../_components/job-form-fields'
import { updateJobFromForm, type FormState } from './actions'

const INITIAL: FormState = { error: null }

export function EditJobForm({
  jobId,
  companies,
  defaults,
  currentIntakeStatus,
}: {
  jobId: string
  companies: JobFormCompany[]
  defaults: JobFormDefaults
  // The current DB intake_status — surfaced as a badge so the user sees the live
  // value even when defaults.intake_status is undefined (which we do for
  // in_production jobs to avoid the form's draft/scheduled/archived <select> from
  // silently proposing a downgrade).
  currentIntakeStatus: string
}) {
  const action = updateJobFromForm.bind(null, jobId)
  const [state, dispatch] = useActionState(action, INITIAL)

  return (
    <form action={dispatch} className="space-y-8">
      {state.error ? (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      {currentIntakeStatus === 'in_production' ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This job is currently <strong>in production</strong>. The Intake status field below
          can only set draft, scheduled, or archived — leave it untouched to keep the job
          in production. Stage transitions during production happen via workstation scans.
        </div>
      ) : null}

      <JobFormFields companies={companies} defaults={defaults} />

      <div className="flex justify-end gap-3 border-t border-border pt-6">
        <Link
          href={`/jobs/${jobId}` as Route}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Save changes
        </button>
      </div>
    </form>
  )
}
