import { requireCustomer } from '@/shared/auth-helpers'

export default async function CustomerJobsPage() {
  await requireCustomer()
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Your Jobs</h1>
      <p className="text-muted-foreground mt-2">Wave 1 — coming soon.</p>
    </main>
  )
}
