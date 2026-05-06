'use client'
import * as React from 'react'

// Shared form fields used by both the create and edit company forms. Field names
// match the Zod schemas in src/modules/crm/actions/companies.ts so a FormData
// round-trip reconstructs CreateCompanyInput / UpdateCompanyInput cleanly.

export interface CompanyFormDefaults {
  name?: string
  phone?: string | null
  email?: string | null
  tax_id?: string | null
  payment_terms?: string | null
  customer_since?: string | null
  notes?: string | null
  shipping_address?: string | null
  shipping_city?: string | null
  shipping_state?: string | null
  shipping_zip?: string | null
  billing_address?: string | null
  billing_city?: string | null
  billing_state?: string | null
  billing_zip?: string | null
}

interface CompanyFormFieldsProps {
  defaults?: CompanyFormDefaults
}

export function CompanyFormFields({ defaults }: CompanyFormFieldsProps) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Customer details
        </h2>
        <div className="mt-3 grid gap-6 lg:grid-cols-2">
          <Field label="Company name" required className="lg:col-span-2">
            <input
              name="name"
              type="text"
              required
              maxLength={200}
              defaultValue={defaults?.name ?? ''}
              placeholder="e.g. Acme Manufacturing"
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Phone">
            <input
              name="phone"
              type="tel"
              maxLength={50}
              defaultValue={defaults?.phone ?? ''}
              placeholder="e.g. (555) 123-4567"
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Email">
            <input
              name="email"
              type="email"
              maxLength={200}
              defaultValue={defaults?.email ?? ''}
              placeholder="ap@example.com"
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Tax ID / EIN">
            <input
              name="tax_id"
              type="text"
              maxLength={50}
              defaultValue={defaults?.tax_id ?? ''}
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Payment terms">
            <input
              name="payment_terms"
              type="text"
              maxLength={100}
              defaultValue={defaults?.payment_terms ?? ''}
              placeholder="e.g. Net 30"
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Customer since">
            <input
              name="customer_since"
              type="date"
              defaultValue={defaults?.customer_since ?? ''}
              className={INPUT_CLASS}
            />
          </Field>
        </div>
      </section>

      <AddressSection
        title="Shipping address"
        prefix="shipping"
        defaults={{
          address: defaults?.shipping_address ?? '',
          city: defaults?.shipping_city ?? '',
          state: defaults?.shipping_state ?? '',
          zip: defaults?.shipping_zip ?? '',
        }}
      />

      <AddressSection
        title="Billing address"
        prefix="billing"
        defaults={{
          address: defaults?.billing_address ?? '',
          city: defaults?.billing_city ?? '',
          state: defaults?.billing_state ?? '',
          zip: defaults?.billing_zip ?? '',
        }}
      />

      <section>
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Notes
        </h2>
        <div className="mt-3">
          <Field label="Internal notes">
            <textarea
              name="notes"
              rows={4}
              maxLength={5000}
              defaultValue={defaults?.notes ?? ''}
              placeholder="Visible to staff only — never sent to the customer"
              className={`${INPUT_CLASS} resize-y`}
            />
          </Field>
        </div>
      </section>
    </div>
  )
}

interface AddressDefaults {
  address: string
  city: string
  state: string
  zip: string
}

function AddressSection({
  title,
  prefix,
  defaults,
}: {
  title: string
  prefix: 'shipping' | 'billing'
  defaults: AddressDefaults
}) {
  return (
    <section>
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="mt-3 grid gap-6 lg:grid-cols-2">
        <Field label="Street address" className="lg:col-span-2">
          <input
            name={`${prefix}_address`}
            type="text"
            maxLength={500}
            defaultValue={defaults.address}
            className={INPUT_CLASS}
          />
        </Field>

        <Field label="City">
          <input
            name={`${prefix}_city`}
            type="text"
            maxLength={100}
            defaultValue={defaults.city}
            className={INPUT_CLASS}
          />
        </Field>

        <div className="grid grid-cols-[1fr_1fr] gap-3">
          <Field label="State">
            <input
              name={`${prefix}_state`}
              type="text"
              maxLength={50}
              defaultValue={defaults.state}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="ZIP">
            <input
              name={`${prefix}_zip`}
              type="text"
              maxLength={20}
              defaultValue={defaults.zip}
              className={INPUT_CLASS}
            />
          </Field>
        </div>
      </div>
    </section>
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
