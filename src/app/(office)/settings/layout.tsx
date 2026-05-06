'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/settings/staff', label: 'Staff' },
  { href: '/settings/workstations', label: 'Workstations' },
  { href: '/settings/shop', label: 'Shop' },
] as const

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage staff, workstations, and shop configuration.</p>
      </header>

      <nav aria-label="Settings" className="flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                'px-4 py-2 text-sm font-medium transition-colors -mb-px border-b-2',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              ].join(' ')}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>

      <div>{children}</div>
    </div>
  )
}
