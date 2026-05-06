'use client'
import { useActionState } from 'react'
import { createWorkstationFromForm, INITIAL_STATE } from './actions'
import { CopyLinkBox } from '../_components/copy-link-box'

export function CreateWorkstationPanel() {
  const [state, dispatch] = useActionState(createWorkstationFromForm, INITIAL_STATE)

  if (state.enrollmentUrl) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-6 space-y-4">
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Workstation &ldquo;{state.workstationName}&rdquo; created — enrollment URL
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Copy this URL and open it on the iPad you want to enroll as this workstation.
            This is the <strong>only way</strong> to set up the iPad — it will not be
            shown again. If you lose it, you&apos;ll need to delete the workstation and
            create a new one.
          </p>
        </div>
        <CopyLinkBox label="Workstation enrollment URL" value={state.enrollmentUrl} />
        <a
          href="/settings/workstations"
          className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Done — back to workstations
        </a>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-base font-semibold tracking-tight">Add workstation</h3>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Each workstation gets a unique enrollment URL for iPad setup.
      </p>

      <form action={dispatch} className="space-y-6">
        {state.error ? (
          <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="ws-name" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Name <span aria-hidden="true" className="text-destructive">*</span>
            </label>
            <input
              id="ws-name"
              name="name"
              type="text"
              required
              maxLength={100}
              placeholder="Booth 1 — Coating"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="ws-stage" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Default stage <span className="font-normal text-muted-foreground/60">(optional)</span>
            </label>
            <input
              id="ws-stage"
              name="default_stage"
              type="text"
              maxLength={100}
              placeholder="coating"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="ws-location" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Location <span className="font-normal text-muted-foreground/60">(optional)</span>
            </label>
            <input
              id="ws-location"
              name="location"
              type="text"
              maxLength={200}
              placeholder="Back of shop, east wall"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Create workstation
          </button>
        </div>
      </form>
    </div>
  )
}
