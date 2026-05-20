'use client'

import { useActionState } from 'react'
import type { TagListItem } from '@/modules/tags'
import { createTagFromSettings, deleteTagFromSettings, type FormState } from './actions'

const INITIAL_FORM_STATE: FormState = { error: null, success: null }

const INPUT_CLASS =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
const PRIMARY_BUTTON_CLASS =
  'rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
const DANGER_BUTTON_CLASS =
  'rounded-md border border-destructive/40 bg-background px-3 py-1.5 text-sm font-medium text-destructive shadow-sm transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

export function TagManager({ tags }: { tags: TagListItem[] }) {
  const [state, dispatch] = useActionState(createTagFromSettings, INITIAL_FORM_STATE)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tag library
          </h2>
        </div>
        {tags.length === 0 ? (
          <p className="px-6 py-5 text-sm text-muted-foreground">No tags created yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {tags.map((tag) => (
              <li key={tag.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: tag.color_hex }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{tag.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{tag.color_hex}</p>
                  </div>
                </div>
                <form action={deleteTagFromSettings.bind(null, tag.id)}>
                  <button type="submit" className={DANGER_BUTTON_CLASS}>
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Create tag
        </h2>
        <form action={dispatch} className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Name
            </span>
            <input name="name" required maxLength={50} className={INPUT_CLASS} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Color
            </span>
            <input
              name="color_hex"
              type="color"
              defaultValue="#64748b"
              className="h-10 w-20 rounded-md border border-input bg-background p-1"
            />
          </label>
          <FormMessage state={state} />
          <button type="submit" className={PRIMARY_BUTTON_CLASS}>
            Create tag
          </button>
        </form>
      </aside>
    </div>
  )
}

function FormMessage({ state }: { state: FormState }) {
  if (!state.error && !state.success) return null
  return (
    <p
      role={state.error ? 'alert' : 'status'}
      className={`rounded-md px-3 py-2 text-sm ${
        state.error
          ? 'border border-destructive/40 bg-destructive/10 text-destructive'
          : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
      }`}
    >
      {state.error ?? state.success}
    </p>
  )
}
