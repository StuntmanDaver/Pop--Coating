'use server'

import { revalidatePath } from 'next/cache'
import {
  archiveContact,
  createContact,
  logActivity,
  updateContact,
} from '@/modules/crm'
import { applyTag, createTag, removeTag } from '@/modules/tags'

export interface FormState {
  error: string | null
  success: string | null
}

export async function createContactForCompany(
  companyId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    await createContact({
      company_id: companyId,
      first_name: stringOrNull(formData.get('first_name')),
      last_name: stringOrNull(formData.get('last_name')),
      email: stringOrNull(formData.get('email')),
      phone: stringOrNull(formData.get('phone')),
      role: stringOrNull(formData.get('role')),
      is_primary: formData.get('is_primary') === 'on',
      notes: stringOrNull(formData.get('notes')),
    })
  } catch (err) {
    return { error: friendlyError(err), success: null }
  }

  revalidatePath(`/companies/${companyId}`)
  return { error: null, success: 'Contact added.' }
}

export async function updateContactForCompany(
  companyId: string,
  contactId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    await updateContact({
      id: contactId,
      first_name: stringOrNull(formData.get('first_name')),
      last_name: stringOrNull(formData.get('last_name')),
      email: stringOrNull(formData.get('email')),
      phone: stringOrNull(formData.get('phone')),
      role: stringOrNull(formData.get('role')),
      is_primary: formData.get('is_primary') === 'on',
      notes: stringOrNull(formData.get('notes')),
    })
  } catch (err) {
    return { error: friendlyError(err), success: null }
  }

  revalidatePath(`/companies/${companyId}`)
  return { error: null, success: 'Contact updated.' }
}

export async function archiveContactForCompany(
  companyId: string,
  contactId: string
): Promise<void> {
  await archiveContact({ id: contactId })
  revalidatePath(`/companies/${companyId}`)
}

export async function logCompanyActivity(
  companyId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    await logActivity({
      entity_type: 'company',
      entity_id: companyId,
      activity_type: stringOrNull(formData.get('activity_type')),
      subject: stringOrNull(formData.get('subject')),
      body: stringOrNull(formData.get('body')),
      customer_visible: formData.get('customer_visible') === 'on',
      occurred_at: dateTimeOrUndefined(formData.get('occurred_at')),
    })
  } catch (err) {
    return { error: friendlyError(err), success: null }
  }

  revalidatePath(`/companies/${companyId}`)
  return { error: null, success: 'Activity logged.' }
}

export async function createAndApplyCompanyTag(
  companyId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const tag = await createTag({
      name: stringOrNull(formData.get('name')),
      color_hex: stringOrNull(formData.get('color_hex')),
    })
    await applyTag({ tag_id: tag.id, entity_type: 'company', entity_id: companyId })
  } catch (err) {
    return { error: friendlyError(err), success: null }
  }

  revalidatePath(`/companies/${companyId}`)
  return { error: null, success: 'Tag created and applied.' }
}

export async function applyCompanyTag(
  companyId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    await applyTag({
      tag_id: stringOrNull(formData.get('tag_id')),
      entity_type: 'company',
      entity_id: companyId,
    })
  } catch (err) {
    return { error: friendlyError(err), success: null }
  }

  revalidatePath(`/companies/${companyId}`)
  return { error: null, success: 'Tag applied.' }
}

export async function removeCompanyTag(companyId: string, tagId: string): Promise<void> {
  await removeTag({ tag_id: tagId, entity_type: 'company', entity_id: companyId })
  revalidatePath(`/companies/${companyId}`)
}

function stringOrNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function dateTimeOrUndefined(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function friendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : 'Unknown error'
  if (message.includes('one_primary_per_company')) {
    return 'This company already has a primary contact. Clear the current primary contact before choosing another one.'
  }
  if (message.includes('tags_tenant_id_name_key')) {
    return 'A tag with that name already exists.'
  }
  return message
}
