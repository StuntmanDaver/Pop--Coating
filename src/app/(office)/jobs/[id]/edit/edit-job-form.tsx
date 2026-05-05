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
}: {
  jobId: string
  companies: JobFormCompany[]
  defaults: JobFormDefaults
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
