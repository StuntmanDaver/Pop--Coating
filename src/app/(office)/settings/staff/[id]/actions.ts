'use server'
import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { updateStaff, deactivateStaff } from '@/modules/settings'

export interface StaffFormState {
  error: string | null
}

const INITIAL_STATE: StaffFormState = { error: null }
export { INITIAL_STATE }

export async function updateStaffFromForm(
  staffId: string,
  _prev: StaffFormState,
  formData: FormData
): Promise<StaffFormState> {
  const input = {
    id: staffId,
    name: stringOrNull(formData.get('name')) ?? undefined,
    phone: stringOrNull(formData.get('phone')),
    role: stringOrNull(formData.get('role')) ?? undefined,
  }

  try {
    await updateStaff(input)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }

  redirect(`/settings/staff/${staffId}?updated=true` as Route)
}

export async function deactivateStaffAction(
  staffId: string,
  _prev: StaffFormState,
  _formData: FormData
): Promise<StaffFormState> {
  try {
    await deactivateStaff({ id: staffId })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }

  redirect('/settings/staff' as Route)
}

function stringOrNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}
