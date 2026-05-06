'use server'
import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { updateShopSettings } from '@/modules/settings'

export interface ShopFormState {
  error: string | null
}

const INITIAL_STATE: ShopFormState = { error: null }
export { INITIAL_STATE }

export async function updateShopSettingsFromForm(
  _prev: ShopFormState,
  formData: FormData
): Promise<ShopFormState> {
  const rawBrandColor = stringOrNull(formData.get('brand_color_hex'))
  const rawDefaultDueDays = intOrNull(formData.get('default_due_days'))
  const rawTabletHours = intOrNull(formData.get('tablet_inactivity_hours'))
  const rawPinMode = stringOrNull(formData.get('pin_mode'))

  // Locked fields — included only if form sends them (non-disabled inputs)
  const rawTimezone = stringOrNull(formData.get('timezone'))
  const rawCurrency = stringOrNull(formData.get('currency'))
  const rawPrefix = stringOrNull(formData.get('job_number_prefix'))

  const input: Record<string, unknown> = {}

  // Only include fields that were submitted (non-null)
  if (rawTimezone !== null) input.timezone = rawTimezone
  if (rawCurrency !== null) input.currency = rawCurrency
  if (rawPrefix !== null) input.job_number_prefix = rawPrefix
  if (rawBrandColor !== null) input.brand_color_hex = rawBrandColor
  if (rawDefaultDueDays !== null) input.default_due_days = rawDefaultDueDays
  if (rawTabletHours !== null) input.tablet_inactivity_hours = rawTabletHours
  if (rawPinMode !== null) input.pin_mode = rawPinMode

  try {
    await updateShopSettings(input)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }

  redirect('/settings/shop?saved=true' as Route)
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
