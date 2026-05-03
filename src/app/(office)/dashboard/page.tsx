import { requireOfficeStaff } from '@/shared/auth-helpers'

export default async function DashboardPage() {
  await requireOfficeStaff()
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground mt-2">Wave 1 — coming soon.</p>
    </main>
  )
}
