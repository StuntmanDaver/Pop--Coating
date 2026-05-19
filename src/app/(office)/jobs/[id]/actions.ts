'use server'
import type { Route } from 'next'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  logActivity,
} from '@/modules/crm'
import {
  archiveJob,
  scheduleJob,
  setJobHold,
  splitJobForMultiColor,
} from '@/modules/jobs'
import { applyTag, createTag, removeTag } from '@/modules/tags'

export interface FormState {
  error: string | null
  success: string | null
}

export async function scheduleJobFromDetail(jobId: string): Promise<void> {
  await scheduleJob({ id: jobId })
  revalidatePath(`/jobs/${jobId}` as Route)
}

export async function releaseJobHoldFromDetail(jobId: string): Promise<void> {
  await setJobHold({ id: jobId, on_hold: false })
  revalidatePath(`/jobs/${jobId}` as Route)
}

export async function archiveJobFromDetail(jobId: string): Promise<void> {
  await archiveJob({ id: jobId })
  redirect('/jobs' as Route)
}

export async function holdJobFromDetail(
  jobId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const holdReason = stringOrNull(formData.get('hold_reason'))

  try {
    await setJobHold({ id: jobId, on_hold: true, hold_reason: holdReason ?? undefined })
    revalidatePath(`/jobs/${jobId}` as Route)
    return { error: null, success: 'Job hold saved.' }
  } catch (err) {
    return { error: friendlyError(err), success: null }
  }
}

export async function splitJobFromDetail(
  jobId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const partCount = intOrNull(formData.get('part_count'))

  try {
    const child = await splitJobForMultiColor({
      parent_job_id: jobId,
      job_name: stringOrUndefined(formData.get('job_name')),
      color: stringOrUndefined(formData.get('color')),
      coating_type: stringOrNull(formData.get('coating_type')),
      part_count: partCount,
      notes: stringOrNull(formData.get('notes')),
    })
    revalidatePath(`/jobs/${jobId}` as Route)
    return { error: null, success: `Created split job ${child.job_number}.` }
  } catch (err) {
    return { error: friendlyError(err), success: null }
  }
}

export async function logJobActivity(
  jobId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    await logActivity({
      entity_type: 'job',
      entity_id: jobId,
      activity_type: stringOrNull(formData.get('activity_type')),
      subject: stringOrNull(formData.get('subject')),
      body: stringOrNull(formData.get('body')),
      customer_visible: formData.get('customer_visible') === 'on',
      occurred_at: dateTimeOrUndefined(formData.get('occurred_at')),
    })
  } catch (err) {
    return { error: friendlyError(err), success: null }
  }

  revalidatePath(`/jobs/${jobId}` as Route)
  return { error: null, success: 'Activity logged.' }
}

export async function createAndApplyJobTag(
  jobId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const tag = await createTag({
      name: stringOrNull(formData.get('name')),
      color_hex: stringOrNull(formData.get('color_hex')),
    })
    await applyTag({ tag_id: tag.id, entity_type: 'job', entity_id: jobId })
  } catch (err) {
    return { error: friendlyError(err), success: null }
  }

  revalidatePath(`/jobs/${jobId}` as Route)
  return { error: null, success: 'Tag created and applied.' }
}

export async function applyJobTag(
  jobId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    await applyTag({
      tag_id: stringOrNull(formData.get('tag_id')),
      entity_type: 'job',
      entity_id: jobId,
    })
  } catch (err) {
    return { error: friendlyError(err), success: null }
  }

  revalidatePath(`/jobs/${jobId}` as Route)
  return { error: null, success: 'Tag applied.' }
}

export async function removeJobTag(jobId: string, tagId: string): Promise<void> {
  await removeTag({ tag_id: tagId, entity_type: 'job', entity_id: jobId })
  revalidatePath(`/jobs/${jobId}` as Route)
}

function stringOrNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function stringOrUndefined(value: FormDataEntryValue | null): string | undefined {
  return stringOrNull(value) ?? undefined
}

function intOrNull(value: FormDataEntryValue | null): number | null {
  const text = stringOrNull(value)
  if (!text) return null
  const parsed = Number.parseInt(text, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function dateTimeOrUndefined(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function friendlyError(err: unknown): string {
  if (!(err instanceof Error)) return 'Unknown error'
  if (err.message.includes('tags_tenant_id_name_key')) {
    return 'A tag with that name already exists.'
  }
  return err.message.replace(/^Invalid input: /, '')
}
