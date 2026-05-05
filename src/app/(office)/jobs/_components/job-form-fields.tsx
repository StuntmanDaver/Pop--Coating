'use client'
import * as React from 'react'

// Shared form fields used by both the create and edit forms. Field names match
// the Zod schemas in src/modules/jobs/actions/jobs.ts so a FormData round-trip
// reconstructs CreateJobInput / UpdateJobInput cleanly.

export interface JobFormCompany {
  id: string
  name: string
}

export interface JobFormDefaults {
  company_id?: string
  contact_id?: string | null
  job_name?: string
  description?: string | null
  customer_po_number?: string | null
  part_count?: number | null
  weight_lbs?: number | string | null
  dimensions_text?: string | null
  color?: string | null
  coating_type?: string | null
  due_date?: string | null
  priority?: 'low' | 'normal' | 'high' | 'rush'
  intake_status?: 'draft' | 'scheduled' | 'archived'
  notes?: string | null
}

interface JobFormFieldsProps {
  companies: JobFormCompany[]
  defaults?: JobFormDefaults
}

export function JobFormFields({ companies, defaults }: JobFormFieldsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Field label="Customer" required>
        <select
          name="company_id"
          required
          defaultValue={defaults?.company_id ?? ''}
          className={SELECT_CLASS}
        >
          <option value="" disabled>Select a customer</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Job name" required>
        <input
          name="job_name"
          type="text"
          required
          maxLength={200}
          defaultValue={defaults?.job_name ?? ''}
          placeholder="e.g. Bumper, gloss black"
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="Customer PO #">
        <input
          name="customer_po_number"
          type="text"
          maxLength={100}
          defaultValue={defaults?.customer_po_number ?? ''}
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="Color">
        <input
          name="color"
          type="text"
          maxLength={100}
          defaultValue={defaults?.color ?? ''}
          placeholder="e.g. RAL 9005 matte"
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="Coating type">
        <input
          name="coating_type"
          type="text"
          maxLength={100}
          defaultValue={defaults?.coating_type ?? ''}
          placeholder="e.g. Powder · Wet · Sandblast"
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="Part count">
        <input
          name="part_count"
          type="number"
          min={0}
          defaultValue={defaults?.part_count ?? ''}
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="Weight (lbs)">
        <input
          name="weight_lbs"
          type="number"
          step="0.1"
          min={0}
          defaultValue={defaults?.weight_lbs?.toString() ?? ''}
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="Dimensions">
        <input
          name="dimensions_text"
          type="text"
          maxLength={200}
          defaultValue={defaults?.dimensions_text ?? ''}
          placeholder="e.g. 60×18×12 in"
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="Due date">
        <input
          name="due_date"
          type="date"
          defaultValue={defaults?.due_date ?? ''}
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="Priority">
        <select name="priority" defaultValue={defaults?.priority ?? 'normal'} className={SELECT_CLASS}>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="rush">Rush</option>
        </select>
      </Field>

      <Field label="Intake status">
        <select name="intake_status" defaultValue={defaults?.intake_status ?? 'draft'} className={SELECT_CLASS}>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="archived">Archived</option>
        </select>
      </Field>

      <Field label="Description" className="lg:col-span-2">
        <textarea
          name="description"
          rows={3}
          maxLength={20000}
          defaultValue={defaults?.description ?? ''}
          className={`${INPUT_CLASS} resize-y`}
        />
      </Field>

      <Field label="Internal notes" className="lg:col-span-2">
        <textarea
          name="notes"
          rows={3}
          maxLength={20000}
          defaultValue={defaults?.notes ?? ''}
          placeholder="Visible to staff only — never sent to the customer"
          className={`${INPUT_CLASS} resize-y`}
        />
      </Field>
    </div>
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
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </label>
      {children}
    </div>
  )
}

const INPUT_CLASS =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
const SELECT_CLASS = INPUT_CLASS
