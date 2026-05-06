'use client'
import type { Route } from 'next'
import { useActionState } from 'react'
import Link from 'next/link'
import { inviteStaffFromForm, INITIAL_STATE } from './actions'

const ROLE_OPTIONS = ['admin', 'manager', 'office', 'shop'] as const

export function InviteStaffForm() {
  const [state, dispatch] = useActionState(inviteStaffFromForm, INITIAL_STATE)

  return (
    <form action={dispatch} className="space-y-8">
      {state.error ? (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Email <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="off"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="jane@example.com"
          />
        </div>

        <div>
          <label htmlFor="name" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Full name <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={200}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Jane Smith"
          />
        </div>

        <div>
          <label htmlFor="role" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Role <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <select
            id="role"
            name="role"
            required
            defaultValue=""
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="" disabled>Select a role…</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Phone <span className="font-normal text-muted-foreground/60">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            maxLength={50}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="+1 555 000 0000"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-6">
        <Link
          href={'/settings/staff' as Route}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Send invite
        </button>
      </div>
    </form>
  )
}
