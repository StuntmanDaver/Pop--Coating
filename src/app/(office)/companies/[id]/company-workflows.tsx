'use client'

import { useActionState } from 'react'
import type { ReactNode } from 'react'
import type { ActivityListItem, ContactListItem } from '@/modules/crm'
import type { TagListItem, TagOnEntity } from '@/modules/tags'
import { Badge } from '@/shared/ui/badge'
import {
  applyCompanyTag,
  archiveContactForCompany,
  createAndApplyCompanyTag,
  createContactForCompany,
  logCompanyActivity,
  removeCompanyTag,
  updateContactForCompany,
  type FormState,
} from './actions'

const INITIAL_FORM_STATE: FormState = { error: null, success: null }

interface CompanyWorkflowsProps {
  companyId: string
  contacts: ContactListItem[]
  activities: ActivityListItem[]
  allTags: TagListItem[]
  companyTags: TagOnEntity[]
}

export function CompanyWorkflows({
  companyId,
  contacts,
  activities,
  allTags,
  companyTags,
}: CompanyWorkflowsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="space-y-6 lg:col-span-2">
        <ContactPanel companyId={companyId} contacts={contacts} />
        <ActivityPanel companyId={companyId} activities={activities} />
      </section>
      <TagPanel companyId={companyId} allTags={allTags} companyTags={companyTags} />
    </div>
  )
}

function ContactPanel({
  companyId,
  contacts,
}: {
  companyId: string
  contacts: ContactListItem[]
}) {
  const createAction = createContactForCompany.bind(null, companyId)
  const [state, dispatch] = useActionState(createAction, INITIAL_FORM_STATE)

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Contacts
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add, edit, or archive people associated with this customer.
          </p>
        </div>
        <Badge variant="muted">{contacts.length} active</Badge>
      </div>

      {contacts.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No contacts on file yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {contacts.map((contact) => (
            <li key={contact.id} className="py-4 first:pt-0 last:pb-0">
              <ContactEditor companyId={companyId} contact={contact} />
            </li>
          ))}
        </ul>
      )}

      <form action={dispatch} className="mt-6 border-t border-border pt-6">
        <h3 className="text-sm font-medium">Add contact</h3>
        <ContactFields />
        <FormMessage state={state} />
        <div className="mt-4 flex justify-end">
          <button type="submit" className={PRIMARY_BUTTON_CLASS}>
            Add contact
          </button>
        </div>
      </form>
    </section>
  )
}

function ContactEditor({
  companyId,
  contact,
}: {
  companyId: string
  contact: ContactListItem
}) {
  const updateAction = updateContactForCompany.bind(null, companyId, contact.id)
  const archiveAction = archiveContactForCompany.bind(null, companyId, contact.id)
  const [state, dispatch] = useActionState(updateAction, INITIAL_FORM_STATE)
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ')

  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">{name}</p>
            {contact.is_primary ? <Badge variant="default">Primary</Badge> : null}
            {contact.role ? <Badge variant="muted">{contact.role}</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {[contact.email, contact.phone].filter(Boolean).join(' | ') || 'No email or phone'}
          </p>
        </div>
        <span className="text-xs font-medium text-muted-foreground group-open:hidden">Edit</span>
      </summary>

      <div className="mt-4 rounded-md border border-border bg-background p-4">
        <form action={dispatch}>
          <ContactFields contact={contact} />
          <FormMessage state={state} />
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <button type="submit" className={PRIMARY_BUTTON_CLASS}>
              Save contact
            </button>
          </div>
        </form>
        <form action={archiveAction} className="mt-3 flex justify-end">
          <button type="submit" className={SECONDARY_BUTTON_CLASS}>
            Archive contact
          </button>
        </form>
      </div>
    </details>
  )
}

function ContactFields({ contact }: { contact?: ContactListItem }) {
  return (
    <div className="mt-3 grid gap-4 md:grid-cols-2">
      <Field label="First name" required>
        <input
          name="first_name"
          required
          maxLength={100}
          defaultValue={contact?.first_name ?? ''}
          className={INPUT_CLASS}
        />
      </Field>
      <Field label="Last name">
        <input
          name="last_name"
          maxLength={100}
          defaultValue={contact?.last_name ?? ''}
          className={INPUT_CLASS}
        />
      </Field>
      <Field label="Email">
        <input
          name="email"
          type="email"
          maxLength={200}
          defaultValue={contact?.email ?? ''}
          className={INPUT_CLASS}
        />
      </Field>
      <Field label="Phone">
        <input
          name="phone"
          type="tel"
          maxLength={50}
          defaultValue={contact?.phone ?? ''}
          className={INPUT_CLASS}
        />
      </Field>
      <Field label="Role">
        <input name="role" maxLength={100} defaultValue={contact?.role ?? ''} className={INPUT_CLASS} />
      </Field>
      <label className="flex items-center gap-2 self-end text-sm text-foreground">
        <input
          name="is_primary"
          type="checkbox"
          defaultChecked={contact?.is_primary ?? false}
          className="h-4 w-4 rounded border-input"
        />
        Primary contact
      </label>
      <Field label="Notes" className="md:col-span-2">
        <textarea
          name="notes"
          rows={3}
          maxLength={5000}
          defaultValue={contact?.notes ?? ''}
          className={`${INPUT_CLASS} resize-y`}
        />
      </Field>
    </div>
  )
}

function ActivityPanel({
  companyId,
  activities,
}: {
  companyId: string
  activities: ActivityListItem[]
}) {
  const action = logCompanyActivity.bind(null, companyId)
  const [state, dispatch] = useActionState(action, INITIAL_FORM_STATE)

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Activity
      </h2>

      <form action={dispatch} className="mt-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-[160px_1fr]">
          <Field label="Type">
            <select name="activity_type" defaultValue="note" className={INPUT_CLASS}>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
              <option value="note">Note</option>
              <option value="sms">SMS</option>
            </select>
          </Field>
          <Field label="Subject" required>
            <input name="subject" required maxLength={500} className={INPUT_CLASS} />
          </Field>
        </div>
        <Field label="Body">
          <textarea name="body" rows={3} maxLength={20000} className={`${INPUT_CLASS} resize-y`} />
        </Field>
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Occurred at">
            <input name="occurred_at" type="datetime-local" className={INPUT_CLASS} />
          </Field>
          <label className="flex items-center gap-2 pb-2 text-sm text-foreground">
            <input name="customer_visible" type="checkbox" className="h-4 w-4 rounded border-input" />
            Customer-visible
          </label>
        </div>
        <FormMessage state={state} />
        <div className="flex justify-end">
          <button type="submit" className={PRIMARY_BUTTON_CLASS}>
            Log activity
          </button>
        </div>
      </form>

      <div className="mt-6 border-t border-border pt-4">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity logged yet.</p>
        ) : (
          <ol className="space-y-4">
            {activities.map((activity) => (
              <li key={activity.id} className="rounded-md border border-border bg-background p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="muted">{activity.activity_type}</Badge>
                  {activity.customer_visible ? <Badge variant="default">Customer-visible</Badge> : null}
                  <time className="text-xs text-muted-foreground">
                    {new Date(activity.occurred_at).toLocaleString()}
                  </time>
                </div>
                <p className="mt-2 text-sm font-medium">{activity.subject}</p>
                {activity.body ? (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    {activity.body}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}

function TagPanel({
  companyId,
  allTags,
  companyTags,
}: {
  companyId: string
  allTags: TagListItem[]
  companyTags: TagOnEntity[]
}) {
  const createAction = createAndApplyCompanyTag.bind(null, companyId)
  const applyAction = applyCompanyTag.bind(null, companyId)
  const [createState, createDispatch] = useActionState(createAction, INITIAL_FORM_STATE)
  const [applyState, applyDispatch] = useActionState(applyAction, INITIAL_FORM_STATE)
  const appliedIds = new Set(companyTags.map((tag) => tag.tag_id))
  const availableTags = allTags.filter((tag) => !appliedIds.has(tag.id))

  return (
    <aside className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tags</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {companyTags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags applied.</p>
        ) : (
          companyTags.map((tag) => (
            <form key={tag.tag_id} action={removeCompanyTag.bind(null, companyId, tag.tag_id)}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium"
                title="Remove tag"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: tag.color_hex }}
                  aria-hidden="true"
                />
                {tag.name}
                <span aria-hidden="true">x</span>
              </button>
            </form>
          ))
        )}
      </div>

      <form action={applyDispatch} className="mt-6 space-y-3 border-t border-border pt-4">
        <h3 className="text-sm font-medium">Apply existing tag</h3>
        <select name="tag_id" className={INPUT_CLASS} defaultValue="">
          <option value="" disabled>
            Select a tag
          </option>
          {availableTags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
        <FormMessage state={applyState} />
        <button type="submit" className={PRIMARY_BUTTON_CLASS} disabled={availableTags.length === 0}>
          Apply tag
        </button>
      </form>

      <form action={createDispatch} className="mt-6 space-y-3 border-t border-border pt-4">
        <h3 className="text-sm font-medium">Create tag</h3>
        <Field label="Name" required>
          <input name="name" required maxLength={50} className={INPUT_CLASS} />
        </Field>
        <Field label="Color" required>
          <input name="color_hex" type="color" defaultValue="#64748b" className="h-10 w-20 rounded-md border border-input bg-background p-1" />
        </Field>
        <FormMessage state={createState} />
        <button type="submit" className={PRIMARY_BUTTON_CLASS}>
          Create tag
        </button>
      </form>
    </aside>
  )
}

function FormMessage({ state }: { state: FormState }) {
  if (!state.error && !state.success) return null
  return (
    <p
      role={state.error ? 'alert' : 'status'}
      className={`mt-3 rounded-md px-3 py-2 text-sm ${
        state.error
          ? 'border border-destructive/40 bg-destructive/10 text-destructive'
          : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
      }`}
    >
      {state.error ?? state.success}
    </p>
  )
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string
  required?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </span>
      {children}
    </label>
  )
}

const INPUT_CLASS =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

const PRIMARY_BUTTON_CLASS =
  'rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'

const SECONDARY_BUTTON_CLASS =
  'rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent'
