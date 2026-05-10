import { notFound } from 'next/navigation'
import { getCompanyById } from '@/modules/crm'
import { EditCompanyForm } from './edit-company-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditCompanyPage({ params }: PageProps) {
  const { id } = await params
  const company = await getCompanyById({ id })

  if (!company) notFound()

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Editing company</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{company.name}</h1>
      </header>

      <EditCompanyForm
        companyId={company.id}
        defaults={{
          name: company.name,
          phone: company.phone,
          email: company.email,
          tax_id: company.tax_id,
          payment_terms: company.payment_terms,
          customer_since: company.customer_since,
          notes: company.notes,
          shipping_address: company.shipping_address,
          shipping_city: company.shipping_city,
          shipping_state: company.shipping_state,
          shipping_zip: company.shipping_zip,
          billing_address: company.billing_address,
          billing_city: company.billing_city,
          billing_state: company.billing_state,
          billing_zip: company.billing_zip,
        }}
      />
    </div>
  )
}
