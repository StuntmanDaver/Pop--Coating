import type { Route } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCompanyById, listActivities, listContacts } from '@/modules/crm'
import { listTags, listTagsForEntity } from '@/modules/tags'
import { Badge } from '@/shared/ui/badge'
import { CompanyWorkflows } from './company-workflows'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params

  const [company, contacts, activities, allTags, companyTags] = await Promise.all([
    getCompanyById({ id }),
    listContacts({ company_id: id, limit: 100, offset: 0 }),
    listActivities({ entity_type: 'company', entity_id: id, limit: 50, offset: 0 }),
    listTags({ limit: 200 }),
    listTagsForEntity({ entity_type: 'company', entity_id: id }),
  ])

  if (!company) notFound()

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Company</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{company.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {company.archived_at ? (
              <Badge variant="muted">Archived</Badge>
            ) : (
              <Badge variant="default">Active</Badge>
            )}
            {company.payment_terms ? (
              <Badge variant="muted">{company.payment_terms}</Badge>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/companies/${company.id}/edit` as Route}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Edit
          </Link>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Contact info
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Field label="Phone" value={company.phone} />
              <Field label="Email" value={company.email} />
              <Field label="Tax ID" value={company.tax_id} />
              <Field label="Customer since" value={company.customer_since} />
            </dl>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <AddressCard
              title="Shipping address"
              address={company.shipping_address}
              city={company.shipping_city}
              state={company.shipping_state}
              zip={company.shipping_zip}
            />
            <AddressCard
              title="Billing address"
              address={company.billing_address}
              city={company.billing_city}
              state={company.billing_state}
              zip={company.billing_zip}
            />
          </div>

          {company.notes ? (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Notes
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{company.notes}</p>
            </div>
          ) : null}
        </section>

        <aside className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Primary contact
          </h2>
          <PrimaryContactSummary contacts={contacts} />
        </aside>
      </div>

      <CompanyWorkflows
        companyId={company.id}
        contacts={contacts}
        activities={activities}
        allTags={allTags}
        companyTags={companyTags}
      />
    </div>
  )
}

function PrimaryContactSummary({
  contacts,
}: {
  contacts: Array<{
    first_name: string
    last_name: string | null
    email: string | null
    phone: string | null
    role: string | null
    is_primary: boolean
  }>
}) {
  const contact = contacts.find((c) => c.is_primary) ?? contacts[0]
  if (!contact) {
    return <p className="mt-4 text-sm text-muted-foreground">No contacts on file yet.</p>
  }

  return (
    <div className="mt-4 text-sm">
      <p className="font-medium">
        {[contact.first_name, contact.last_name].filter(Boolean).join(' ')}
      </p>
      {contact.role ? <p className="mt-1 text-muted-foreground">{contact.role}</p> : null}
      {contact.email ? <p className="mt-3 text-muted-foreground">{contact.email}</p> : null}
      {contact.phone ? <p className="text-muted-foreground">{contact.phone}</p> : null}
    </div>
  )
}

function AddressCard({
  title,
  address,
  city,
  state,
  zip,
}: {
  title: string
  address: string | null | undefined
  city: string | null | undefined
  state: string | null | undefined
  zip: string | null | undefined
}) {
  const hasAny = Boolean(address ?? city ?? state ?? zip)
  const cityState = [city, state].filter(Boolean).join(', ')
  const cityStateZip = [cityState, zip].filter((part) => part && part.length > 0).join(' ')

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h2>
      {hasAny ? (
        <address className="mt-3 not-italic text-sm leading-relaxed">
          {address ? <div>{address}</div> : null}
          {cityStateZip ? <div>{cityStateZip}</div> : null}
        </address>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">—</p>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-foreground">
        {value ?? <span className="text-muted-foreground">—</span>}
      </dd>
    </>
  )
}
