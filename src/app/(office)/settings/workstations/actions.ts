'use server'
import { createWorkstation } from '@/modules/settings'

export interface CreateWorkstationState {
  error: string | null
  enrollmentUrl: string | null
  workstationName: string | null
}

const INITIAL_STATE: CreateWorkstationState = {
  error: null,
  enrollmentUrl: null,
  workstationName: null,
}
export { INITIAL_STATE }

export async function createWorkstationFromForm(
  _prev: CreateWorkstationState,
  formData: FormData
): Promise<CreateWorkstationState> {
  const input = {
    name: stringOrNull(formData.get('name')),
    default_stage: stringOrNull(formData.get('default_stage')) ?? undefined,
    location: stringOrNull(formData.get('location')) ?? undefined,
  }

  let result: Awaited<ReturnType<typeof createWorkstation>>
  try {
    result = await createWorkstation(input)
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Unknown error',
      enrollmentUrl: null,
      workstationName: null,
    }
  }

  // SECURITY: only return the enrollment_url and safe fields — never device_token.
  // The workstation object in result contains device_token — do not spread it.
  return {
    error: null,
    enrollmentUrl: result.enrollment_url,
    workstationName: result.workstation.name,
  }
}

function stringOrNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}
