import { AlertCircle, CalendarClock, Factory, PauseCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import type { DashboardCounts } from '../queries/dashboard'

type MetricTone = 'normal' | 'attention' | 'danger'

type MetricCardProps = {
  label: string
  value: number
  helper: string
  Icon: LucideIcon
  tone?: MetricTone
}

const TONE_CLASSES: Record<MetricTone, string> = {
  normal: 'text-muted-foreground',
  attention: 'text-primary',
  danger: 'text-destructive',
}

function MetricCard({ label, value, helper, Icon, tone = 'normal' }: MetricCardProps) {
  return (
    <Card className="rounded-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className="rounded-md border border-border bg-muted/5 p-1.5">
          <Icon className={cn('h-4 w-4', TONE_CLASSES[tone])} aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tabular-nums tracking-tight">{value}</div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  )
}

type Props = {
  counts: DashboardCounts
}

export function MetricsRow({ counts }: Props) {
  return (
    <section aria-labelledby="dashboard-metrics-title">
      <h2 id="dashboard-metrics-title" className="sr-only">
        Production metrics
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="In production"
          value={counts.jobs_in_production}
          helper="Jobs currently moving through the shop."
          Icon={Factory}
          tone="attention"
        />
        <MetricCard
          label="On hold"
          value={counts.jobs_on_hold}
          helper="Needs office or customer resolution."
          Icon={PauseCircle}
        />
        <MetricCard
          label="Overdue"
          value={counts.jobs_overdue}
          helper="Past due date and still open."
          Icon={AlertCircle}
          tone="danger"
        />
        <MetricCard
          label="Due in 7 days"
          value={counts.jobs_due_this_week}
          helper="Near-term work requiring visibility."
          Icon={CalendarClock}
        />
      </div>
    </section>
  )
}
