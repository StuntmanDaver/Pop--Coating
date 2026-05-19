'use client'
import type { ReactNode } from 'react'
import { useActionState } from 'react'
import type { ActivityListItem } from '@/modules/crm'
import type { TagListItem, TagOnEntity } from '@/modules/tags'
import { Badge } from '@/shared/ui/badge'
import {
  applyJobTag,
  archiveJobFromDetail,
  createAndApplyJobTag,
  holdJobFromDetail,
  logJobActivity,
  removeJobTag,
  releaseJobHoldFromDetail,
  scheduleJobFromDetail,
  splitJobFromDetail,
  type FormState,
} from './actions'

const INITIAL_FORM_STATE: FormState = { error: null, success: null }

interface JobDetailActionsProps {
  jobId: string
  intakeStatus: string
  onHold: boolean
  parentJobId: string | null
  activities: ActivityListItem[]
  allTags: TagListItem[]
  jobTags: TagOnEntity[]
}

const INPUT_CLASS =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
const PRIMARY_BUTTON_CLASS =
  'rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
const SECONDARY_BUTTON_CLASS =
  'rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
const DANGER_BUTTON_CLASS =
  'rounded-md border border-destructive/40 bg-background px-4 py-2 text-sm font-medium text-destructive shadow-sm transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

export function JobDetailActions({
  jobId,
  intakeStatus,
  onHold,
  parentJobId,
  activities,
  allTags,
  jobTags,
}: JobDetailActionsProps) {
  const scheduleAction = scheduleJobFromDetail.bind(null, jobId)
  const releaseAction = releaseJobHoldFromDetail.bind(null, jobId)
  const archiveAction = archiveJobFromDetail.bind(null, jobId)
  const holdAction = holdJobFromDetail.bind(null, jobId)
  const splitAction = splitJobFromDetail.bind(null, jobId)
  const [holdState, holdDispatch] = useActionState(holdAction, INITIAL_FORM_STATE)
  const [splitState, splitDispatch] = useActionState(splitAction, INITIAL_FORM_STATE)
  const canSchedule = intakeStatus === 'draft'
  const canSplit = !parentJobId && ['draft', 'scheduled'].includes(intakeStatus)

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="space-y-6 lg:col-span-2">
        <section className="rounded-lg border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Job controls
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Office-only lifecycle controls. Production stage changes still happen from scans.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canSchedule ? (
                <form action={scheduleAction}>
                  <button type="submit" className={PRIMARY_BUTTON_CLASS}>
                    Schedule
                  </button>
                </form>
              ) : null}
              {onHold ? (
                <form action={releaseAction}>
                  <button type="submit" className={SECONDARY_BUTTON_CLASS}>
                    Release hold
                  </button>
                </form>
              ) : null}
              <form action={archiveAction}>
                <button type="submit" className={DANGER_BUTTON_CLASS}>
                  Archive
                </button>
              </form>
            </div>
          </div>

          {!onHold ? (
            <form
              action={holdDispatch}
              className="mt-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-end"
            >
              <label>
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Hold reason
                </span>
                <input
                  name="hold_reason"
                  type="text"
                  maxLength={500}
                  required
                  className={INPUT_CLASS}
                />
              </label>
              <button type="submit" className={SECONDARY_BUTTON_CLASS}>
                Put on hold
              </button>
              <FormMessage state={holdState} />
            </form>
          ) : null}

          {canSplit ? (
            <form action={splitDispatch} className="mt-6 border-t border-border pt-6">
              <h3 className="text-sm font-medium">Multi-color split</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Child job name">
                  <input name="job_name" type="text" maxLength={200} className={INPUT_CLASS} />
                </Field>
                <Field label="Color" required>
                  <input name="color" type="text" maxLength={100} required className={INPUT_CLASS} />
                </Field>
                <Field label="Coating type">
                  <input name="coating_type" type="text" maxLength={100} className={INPUT_CLASS} />
                </Field>
                <Field label="Part count">
                  <input name="part_count" type="number" min={0} className={INPUT_CLASS} />
                </Field>
                <Field label="Split notes" className="md:col-span-2">
                  <textarea
                    name="notes"
                    rows={3}
                    maxLength={20000}
                    className={`${INPUT_CLASS} resize-y`}
                  />
                </Field>
              </div>
              <div className="mt-4 flex justify-end">
                <button type="submit" className={PRIMARY_BUTTON_CLASS}>
                  Create split job
                </button>
              </div>
              <FormMessage state={splitState} />
            </form>
          ) : null}
        </section>

        <ActivityPanel jobId={jobId} activities={activities} />
      </section>

      <TagPanel jobId={jobId} allTags={allTags} jobTags={jobTags} />
    </div>
  )
}

function ActivityPanel({
  jobId,
  activities,
}: {
  jobId: string
  activities: ActivityListItem[]
}) {
  const action = logJobActivity.bind(null, jobId)
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
  jobId,
  allTags,
  jobTags,
}: {
  jobId: string
  allTags: TagListItem[]
  jobTags: TagOnEntity[]
}) {
  const createAction = createAndApplyJobTag.bind(null, jobId)
  const applyAction = applyJobTag.bind(null, jobId)
  const [createState, createDispatch] = useActionState(createAction, INITIAL_FORM_STATE)
  const [applyState, applyDispatch] = useActionState(applyAction, INITIAL_FORM_STATE)
  const appliedIds = new Set(jobTags.map((tag) => tag.tag_id))
  const availableTags = allTags.filter((tag) => !appliedIds.has(tag.id))

  return (
    <aside className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tags</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {jobTags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags applied.</p>
        ) : (
          jobTags.map((tag) => (
            <form key={tag.tag_id} action={removeJobTag.bind(null, jobId, tag.tag_id)}>
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
          <input
            name="color_hex"
            type="color"
            defaultValue="#64748b"
            className="h-10 w-20 rounded-md border border-input bg-background p-1"
          />
        </Field>
        <FormMessage state={createState} />
        <button type="submit" className={PRIMARY_BUTTON_CLASS}>
          Create tag
        </button>
      </form>
    </aside>
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

function FormMessage({ state }: { state: { error: string | null; success: string | null } }) {
  if (!state.error && !state.success) return null
  return (
    <p
      role={state.error ? 'alert' : 'status'}
      className={`mt-3 text-sm ${state.error ? 'text-destructive' : 'text-muted-foreground'}`}
    >
      {state.error ?? state.success}
    </p>
  )
}
