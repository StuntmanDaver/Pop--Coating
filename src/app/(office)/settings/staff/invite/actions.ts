'use server'
import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { inviteStaff } from '@/modules/settings'

export interface InviteFormState {
  error: string | null
  inviteLink: string | null
  staffEmail: string | null
}

const INITIAL_STATE: InviteFormState = { error: null, inviteLink: null, staffEmail: null }
export { INITIAL_STATE }

export async function inviteStaffFromForm(
  _prev: InviteFormState,
  formData: FormData
): Promise<InviteFormState> {
  const input = {
    email: stringOrNull(formData.get('email')),
    name: stringOrNull(formData.get('name')),
    role: stringOrNull(formData.get('role')),
    phone: stringOrNull(formData.get('phone')),
  }

  let result: Awaited<ReturnType<typeof inviteStaff>>
  try {
    result = await inviteStaff(input)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error', inviteLink: null, staffEmail: null }
  }

  // On success: redirect to staff list. The invite link is surfaced server-side by
  // the detail page. We can't pass it through redirect — so we redirect to the new
  // staff detail page which will show an "invite sent" banner.
  // If an invite_link exists, pass it via searchParam so the detail page can display it.
  const base = `/settings/staff/${result.staff.id}`
  if (result.invite_link) {
    redirect(`${base}?invite_link=${encodeURIComponent(result.invite_link)}` as Route)
  }
  redirect(`${base}?invited=true` as Route)
}

function stringOrNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}
