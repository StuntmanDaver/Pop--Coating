import Link from 'next/link'
import { requireOfficeStaff } from '@/shared/auth-helpers'
import { signOutStaff } from '@/modules/auth/actions/sign-out'

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/companies', label: 'Companies' },
  { href: '/settings', label: 'Settings' },
  { href: '/scan', label: 'Scan station' },
] as const

// Wave 1 single-tenant. Wave 4 makes this dynamic by fetching tenants.name via a
// server-side query (auth hook deliberately doesn't include tenant_name in JWT
// claims — claim shape is { tenant_id, audience, role, staff_id?, workstation_id?,
// company_id?, customer_user_id? } per migration 0007_auth_hook.sql).
const TENANT_NAME = 'Pops Industrial Coatings'

export default async function OfficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireOfficeStaff()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-3">
          <Link href="/dashboard" className="flex items-baseline gap-2">
            <span className="text-base font-semibold tracking-tight">{TENANT_NAME}</span>
            <span className="text-xs text-muted-foreground">/ shop ops</span>
          </Link>
          <nav aria-label="Primary" className="flex flex-1 items-center gap-1 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={signOutStaff}>
            <button
              type="submit"
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-7xl px-6 py-10">
        {children}
      </main>
    </div>
  )
}
