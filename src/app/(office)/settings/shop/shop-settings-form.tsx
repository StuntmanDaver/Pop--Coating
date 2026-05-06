'use client'
import { useActionState } from 'react'
import { updateShopSettingsFromForm, INITIAL_STATE } from './actions'

interface ShopSettings {
  timezone: string | null
  currency: string | null
  job_number_prefix: string | null
  brand_color_hex: string | null
  default_due_days: number | null
  tablet_inactivity_hours: number | null
  pin_mode: string | null
  is_first_job_created: boolean
}

export function ShopSettingsForm({ settings }: { settings: ShopSettings }) {
  const [state, dispatch] = useActionState(updateShopSettingsFromForm, INITIAL_STATE)
  const locked = settings.is_first_job_created

  return (
    <form action={dispatch} className="space-y-8">
      {state.error ? (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      {locked ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Some fields are locked.</strong> Timezone, currency, and job number prefix
          cannot be changed after the first job has been created because they are embedded
          in existing job numbers and printed packets.
        </div>
      ) : null}

      <fieldset className="space-y-5">
        <legend className="text-sm font-semibold tracking-tight">Job numbering</legend>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="timezone" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Timezone {locked ? <LockedBadge /> : null}
            </label>
            <input
              id="timezone"
              name="timezone"
              type="text"
              maxLength={64}
              defaultValue={settings.timezone ?? ''}
              disabled={locked}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="America/New_York"
            />
          </div>

          <div>
            <label htmlFor="currency" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Currency (ISO) {locked ? <LockedBadge /> : null}
            </label>
            <input
              id="currency"
              name="currency"
              type="text"
              maxLength={3}
              defaultValue={settings.currency ?? ''}
              disabled={locked}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="USD"
            />
          </div>

          <div>
            <label htmlFor="job_number_prefix" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Job number prefix {locked ? <LockedBadge /> : null}
            </label>
            <input
              id="job_number_prefix"
              name="job_number_prefix"
              type="text"
              maxLength={20}
              defaultValue={settings.job_number_prefix ?? ''}
              disabled={locked}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="POPS"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="text-sm font-semibold tracking-tight">Branding &amp; defaults</legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="brand_color_hex" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Brand color (hex)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="brand_color_hex_picker"
                name="brand_color_hex_picker"
                type="color"
                aria-hidden="true"
                defaultValue={settings.brand_color_hex ?? '#000000'}
                onChange={(e) => {
                  const textInput = document.getElementById('brand_color_hex') as HTMLInputElement | null
                  if (textInput) textInput.value = e.target.value
                }}
                className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-1"
              />
              <input
                id="brand_color_hex"
                name="brand_color_hex"
                type="text"
                maxLength={7}
                defaultValue={settings.brand_color_hex ?? ''}
                pattern="^#[0-9A-Fa-f]{6}$"
                placeholder="#1a2b3c"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div>
            <label htmlFor="default_due_days" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Default due days
            </label>
            <input
              id="default_due_days"
              name="default_due_days"
              type="number"
              min={1}
              max={365}
              defaultValue={settings.default_due_days ?? ''}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="7"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="text-sm font-semibold tracking-tight">Tablet &amp; scan settings</legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="tablet_inactivity_hours" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tablet inactivity timeout (hours)
            </label>
            <input
              id="tablet_inactivity_hours"
              name="tablet_inactivity_hours"
              type="number"
              min={1}
              max={24}
              defaultValue={settings.tablet_inactivity_hours ?? ''}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="1"
            />
          </div>

          <div>
            <label htmlFor="pin_mode" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              PIN mode
            </label>
            <select
              id="pin_mode"
              name="pin_mode"
              defaultValue={settings.pin_mode ?? 'per_scan'}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="per_scan">per_scan — employee enters PIN each scan</option>
              <option value="per_shift">per_shift — employee signs in once per shift</option>
            </select>
          </div>
        </div>
      </fieldset>

      <div className="flex justify-end border-t border-border pt-6">
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Save settings
        </button>
      </div>
    </form>
  )
}

function LockedBadge() {
  return (
    <span className="ml-1 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-amber-300">
      Locked
    </span>
  )
}
