import type { Route } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCompanyById, listContacts } from '@/modules/crm'
import { Badge } from '@/shared/ui/badge'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params

  const [company, contacts] = await Promise.all([
    getCompanyById({ id }),
    listContacts({ company_id: id, limit: 100, offset: 0 }),
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
        <section className="lg:col-span-2 space-y-6">
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
            Contacts
          </h2>
          {contacts.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No contacts on file yet.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {contacts.map((c) => (
                <li key={c.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {[c.first_name, c.last_name].filter(Boolean).join(' ')}
                    </p>
                    {c.is_primary ? <Badge variant="default">Primary</Badge> : null}
                  </div>
                  {c.email ? (
                    <p className="mt-1 text-xs text-muted-foreground">{c.email}</p>
                  ) : null}
                  {c.phone ? (
                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
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
