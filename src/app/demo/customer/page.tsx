import Link from 'next/link'
import type { Route } from 'next'
import { ArrowLeft, CheckCircle2, Clock3, PackageCheck } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'

const jobs = [
  {
    jobNumber: 'POPS-2026-1047',
    name: 'Aluminum guardrail assemblies',
    status: 'Powder coating',
    due: 'May 24',
    tone: 'default' as const,
  },
  {
    jobNumber: 'POPS-2026-1039',
    name: 'Steel equipment housings',
    status: 'Ready for pickup',
    due: 'May 21',
    tone: 'success' as const,
  },
]

const timeline = [
  {
    title: 'Powder booth scan recorded',
    detail: 'Station 3 advanced POPS-2026-1047 to powder coating.',
    time: 'Today, 10:18 AM',
    icon: PackageCheck,
  },
  {
    title: 'Surface prep completed',
    detail: 'Media blasting and inspection were completed yesterday.',
    time: 'Yesterday, 4:42 PM',
    icon: CheckCircle2,
  },
  {
    title: 'Job packet printed',
    detail: 'The QR packet was created at intake and attached to the work order.',
    time: 'May 19, 8:14 AM',
    icon: Clock3,
  },
] as const

export default function CustomerDemoPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
        <Button asChild variant="ghost" className="-ml-3">
          <Link href={'/demo' as Route}>
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Demo home
          </Link>
        </Button>

        <header className="mt-8 flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Customer portal
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Active jobs
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Current production visibility for customer work in progress.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card px-5 py-4">
            <p className="text-sm text-muted-foreground">Customer</p>
            <p className="mt-1 font-semibold">Acme Fabrication</p>
          </div>
        </header>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <section className="grid gap-4" aria-label="Customer jobs">
            {jobs.map((job) => (
              <Card key={job.jobNumber} className="rounded-lg">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                        {job.jobNumber}
                      </p>
                      <h2 className="mt-1 text-xl font-semibold">{job.name}</h2>
                    </div>
                    <Badge variant={job.tone === 'success' ? 'success' : 'default'}>
                      {job.status}
                    </Badge>
                  </div>
                  <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Due
                      </dt>
                      <dd className="mt-1 font-medium">{job.due}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Shop
                      </dt>
                      <dd className="mt-1 font-medium">Pops Industrial Coatings</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            ))}
          </section>

          <Card className="rounded-lg">
            <CardContent className="p-5">
              <h2 className="text-xl font-semibold">Recent activity</h2>
              <ol className="mt-5 space-y-5">
                {timeline.map((event) => {
                  const Icon = event.icon
                  return (
                    <li key={event.title} className="flex gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <Icon aria-hidden="true" className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {event.detail}
                        </p>
                        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {event.time}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
