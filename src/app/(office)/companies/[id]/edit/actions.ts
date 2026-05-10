'use server'
import type { Route } from 'next'
import { redirect } from 'next/navigation'
import { updateCompany } from '@/modules/crm'

export interface FormState {
  error: string | null
}

// Partial-update bridge. Build a sparse payload — only include fields the user
// actually entered. updateCompany's UpdateCompanySchema is a .partial() over the
// create schema, so dropping `undefined` keys keeps the contract clean.
export async function updateCompanyFromForm(
  companyId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const input: Record<string, unknown> = { id: companyId }

  const text = (key: string) => formDataString(formData.get(key))

  assignIfDefined(input, 'name', text('name'))
  assignIfDefined(input, 'phone', text('phone'))
  assignIfDefined(input, 'email', text('email'))
  assignIfDefined(input, 'tax_id', text('tax_id'))
  assignIfDefined(input, 'payment_terms', text('payment_terms'))
  assignIfDefined(input, 'customer_since', text('customer_since'))
  assignIfDefined(input, 'notes', text('notes'))
  assignIfDefined(input, 'shipping_address', text('shipping_address'))
  assignIfDefined(input, 'shipping_city', text('shipping_city'))
  assignIfDefined(input, 'shipping_state', text('shipping_state'))
  assignIfDefined(input, 'shipping_zip', text('shipping_zip'))
  assignIfDefined(input, 'billing_address', text('billing_address'))
  assignIfDefined(input, 'billing_city', text('billing_city'))
  assignIfDefined(input, 'billing_state', text('billing_state'))
  assignIfDefined(input, 'billing_zip', text('billing_zip'))

  try {
    await updateCompany(input)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }

  redirect(`/companies/${companyId}` as Route)
}

function formDataString(v: FormDataEntryValue | null): string | undefined {
  if (typeof v !== 'string') return undefined
  const trimmed = v.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function assignIfDefined<T extends object>(target: T, key: string, value: unknown) {
  if (value !== undefined) (target as Record<string, unknown>)[key] = value
}
