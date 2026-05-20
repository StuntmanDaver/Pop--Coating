'use server'

import { revalidatePath } from 'next/cache'
import { createTag, deleteTag } from '@/modules/tags'

export interface FormState {
  error: string | null
  success: string | null
}

export async function createTagFromSettings(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    await createTag({
      name: stringOrNull(formData.get('name')),
      color_hex: stringOrNull(formData.get('color_hex')),
    })
  } catch (err) {
    return { error: friendlyError(err), success: null }
  }

  revalidatePath('/settings/tags')
  return { error: null, success: 'Tag created.' }
}

export async function deleteTagFromSettings(tagId: string): Promise<void> {
  await deleteTag({ id: tagId })
  revalidatePath('/settings/tags')
}

function stringOrNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function friendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : 'Unknown error'
  if (message.includes('tags_tenant_id_name_key')) {
    return 'A tag with that name already exists.'
  }
  return message
}
