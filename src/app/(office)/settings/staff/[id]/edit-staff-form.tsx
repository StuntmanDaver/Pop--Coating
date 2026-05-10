'use client'
import type { Route } from 'next'
import { useActionState } from 'react'
import Link from 'next/link'
import { updateStaffFromForm, deactivateStaffAction, INITIAL_STATE } from './actions'
import type { StaffListItem } from '@/modules/settings'

const ROLE_OPTIONS = ['admin', 'manager', 'office', 'shop'] as const

interface EditStaffFormProps {
  staff: StaffListItem
}

export function EditStaffForm({ staff }: EditStaffFormProps) {
  const updateAction = updateStaffFromForm.bind(null, staff.id)
  const [updateState, updateDispatch] = useActionState(updateAction, INITIAL_STATE)

  const deactivateAction = deactivateStaffAction.bind(null, staff.id)
  const [deactivateState, deactivateDispatch] = useActionState(deactivateAction, INITIAL_STATE)

  const error = updateState.error ?? deactivateState.error

  return (
    <div className="space-y-8">
      {error ? (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <form action={updateDispatch} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={staff.name}
              required
              maxLength={200}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Phone <span className="font-normal text-muted-foreground/60">(optional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={staff.phone ?? ''}
              maxLength={50}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="role" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Role
            </label>
            <select
              id="role"
              name="role"
              defaultValue={ROLE_OPTIONS.includes(staff.role as typeof ROLE_OPTIONS[number]) ? staff.role : ''}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Email
            </p>
            <p className="py-2 text-sm text-muted-foreground">{staff.email}</p>
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
            Save changes
          </button>
        </div>
      </form>

      {staff.is_active ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
          <h3 className="text-sm font-semibold text-destructive">Deactivate staff member</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Deactivating cannot be undone from this UI. The staff member will lose access immediately
            and cannot be reactivated through this interface. Continue?
          </p>
          <form action={deactivateDispatch} className="mt-4">
            <button
              type="submit"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
            >
              Deactivate staff member
            </button>
          </form>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/5 p-6">
          <p className="text-sm text-muted-foreground">
            This staff member is <strong>inactive</strong>. They have no active system access.
          </p>
        </div>
      )}
    </div>
  )
}
