import Link from 'next/link'
import type { Route } from 'next'
import { ArrowRight, ClipboardList, Factory, ScanLine } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'

const demoAreas = [
  {
    title: 'Office Dashboard',
    description: 'Job intake, company records, packet printing, and production status.',
    href: '/sign-in',
    icon: ClipboardList,
    action: 'Open staff app',
  },
  {
    title: 'Shop Floor Scanner',
    description: 'iPad-friendly station view for QR scans, PIN attribution, and stage updates.',
    href: '/scan',
    icon: ScanLine,
    action: 'Open scanner',
  },
  {
    title: 'Customer Tracking',
    description: 'Customer-facing job visibility with status, due dates, and shop activity.',
    href: '/demo/customer',
    icon: Factory,
    action: 'Open customer view',
  },
] as const

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-5 py-10 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Pops Industrial Coatings
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Operations demo
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            A single entry point for the shop office, production floor, and customer
            tracking experience.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {demoAreas.map((area) => {
            const Icon = area.icon
            return (
              <Card key={area.title} className="rounded-lg">
                <CardContent className="flex h-full flex-col p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <h2 className="mt-5 text-xl font-semibold tracking-tight">
                    {area.title}
                  </h2>
                  <p className="mt-3 min-h-20 text-sm leading-6 text-muted-foreground">
                    {area.description}
                  </p>
                  <Button asChild className="mt-auto w-full">
                    <Link href={area.href as Route}>
                      {area.action}
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </main>
  )
}
