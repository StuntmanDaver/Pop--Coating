'use server'
import type { Route } from 'next'
import { redirect } from 'next/navigation'
import { createJob } from '@/modules/jobs'

export interface FormState {
  error: string | null
}

// Bridge between the FormData posted by <form action={...}> and the typed
// createJob Server Action. Returns FormState (consumed by useActionState).
// Redirect on success — Next intercepts the throw so it doesn't surface as an error.
export async function createJobFromForm(_prev: FormState, formData: FormData): Promise<FormState> {
  const input = {
    company_id: stringOrNull(formData.get('company_id')),
    job_name: stringOrNull(formData.get('job_name')),
    customer_po_number: stringOrNull(formData.get('customer_po_number')),
    color: stringOrNull(formData.get('color')),
    coating_type: stringOrNull(formData.get('coating_type')),
    part_count: intOrNull(formData.get('part_count')),
    weight_lbs: numberOrNull(formData.get('weight_lbs')),
    dimensions_text: stringOrNull(formData.get('dimensions_text')),
    due_date: stringOrNull(formData.get('due_date')),
    priority: stringOrNull(formData.get('priority')),
    intake_status: stringOrNull(formData.get('intake_status')),
    description: stringOrNull(formData.get('description')),
    notes: stringOrNull(formData.get('notes')),
  }

  let jobId: string
  try {
    const created = await createJob(input)
    jobId = created.id
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }

  redirect(`/jobs/${jobId}` as Route)
}

function stringOrNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function intOrNull(value: FormDataEntryValue | null): number | null {
  const s = stringOrNull(value)
  if (s == null) return null
  const n = Number.parseInt(s, 10)
  return Number.isFinite(n) ? n : null
}

function numberOrNull(value: FormDataEntryValue | null): number | null {
  const s = stringOrNull(value)
  if (s == null) return null
  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? n : null
}
