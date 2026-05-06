'use server'
import type { Route } from 'next'
import { redirect } from 'next/navigation'
import { createCompany } from '@/modules/crm'

export interface FormState {
  error: string | null
}

// Bridge between the FormData posted by <form action={...}> and the typed
// createCompany Server Action. Returns FormState (consumed by useActionState).
// Redirect on success — Next intercepts the throw so it doesn't surface as an error.
export async function createCompanyFromForm(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const input = {
    name: stringOrNull(formData.get('name')),
    phone: stringOrNull(formData.get('phone')),
    email: stringOrNull(formData.get('email')),
    tax_id: stringOrNull(formData.get('tax_id')),
    payment_terms: stringOrNull(formData.get('payment_terms')),
    customer_since: stringOrNull(formData.get('customer_since')),
    notes: stringOrNull(formData.get('notes')),
    shipping_address: stringOrNull(formData.get('shipping_address')),
    shipping_city: stringOrNull(formData.get('shipping_city')),
    shipping_state: stringOrNull(formData.get('shipping_state')),
    shipping_zip: stringOrNull(formData.get('shipping_zip')),
    billing_address: stringOrNull(formData.get('billing_address')),
    billing_city: stringOrNull(formData.get('billing_city')),
    billing_state: stringOrNull(formData.get('billing_state')),
    billing_zip: stringOrNull(formData.get('billing_zip')),
  }

  let companyId: string
  try {
    const created = await createCompany(input)
    companyId = created.id
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }

  redirect(`/companies/${companyId}` as Route)
}

function stringOrNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}
