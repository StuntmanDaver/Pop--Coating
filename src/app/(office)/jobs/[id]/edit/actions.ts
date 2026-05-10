'use server'
import type { Route } from 'next'
import { redirect } from 'next/navigation'
import { updateJob } from '@/modules/jobs'

export interface FormState {
  error: string | null
}

export async function updateJobFromForm(
  jobId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  // Build a partial — only include fields the user actually entered. updateJob
  // tolerates nulls for nullable fields; we send `undefined` for blanks so the
  // schema's .optional() / .partial() works cleanly.
  const input: Record<string, unknown> = { id: jobId }

  const text = (key: string) => formDataString(formData.get(key))
  const intVal = (key: string) => formDataInt(formData.get(key))
  const num = (key: string) => formDataNumber(formData.get(key))

  assignIfDefined(input, 'company_id', text('company_id'))
  assignIfDefined(input, 'job_name', text('job_name'))
  assignIfDefined(input, 'customer_po_number', text('customer_po_number'))
  assignIfDefined(input, 'color', text('color'))
  assignIfDefined(input, 'coating_type', text('coating_type'))
  assignIfDefined(input, 'part_count', intVal('part_count'))
  assignIfDefined(input, 'weight_lbs', num('weight_lbs'))
  assignIfDefined(input, 'dimensions_text', text('dimensions_text'))
  assignIfDefined(input, 'due_date', text('due_date'))
  assignIfDefined(input, 'priority', text('priority'))
  assignIfDefined(input, 'intake_status', text('intake_status'))
  assignIfDefined(input, 'description', text('description'))
  assignIfDefined(input, 'notes', text('notes'))

  try {
    await updateJob(input)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }

  redirect(`/jobs/${jobId}` as Route)
}

function formDataString(v: FormDataEntryValue | null): string | undefined {
  if (typeof v !== 'string') return undefined
  const trimmed = v.trim()
  return trimmed.length > 0 ? trimmed : undefined
}
function formDataInt(v: FormDataEntryValue | null): number | undefined {
  const s = formDataString(v)
  if (s == null) return undefined
  const n = Number.parseInt(s, 10)
  return Number.isFinite(n) ? n : undefined
}
function formDataNumber(v: FormDataEntryValue | null): number | undefined {
  const s = formDataString(v)
  if (s == null) return undefined
  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? n : undefined
}
function assignIfDefined<T extends object>(target: T, key: string, value: unknown) {
  if (value !== undefined) (target as Record<string, unknown>)[key] = value
}
