import { NewCompanyForm } from './new-company-form'

export default function NewCompanyPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">New company</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customers, prospects, and partners. Contacts can be added after creation.
        </p>
      </header>

      <NewCompanyForm />
    </div>
  )
}
