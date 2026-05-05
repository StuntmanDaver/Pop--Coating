import { getDashboardCounts } from '@/modules/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { cn } from '@/lib/utils'
import { Factory, PauseCircle, AlertCircle, CalendarClock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: number
  Icon: LucideIcon
  iconClassName?: string
}

function MetricCard({ label, value, Icon, iconClassName }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className={cn('h-4 w-4', iconClassName ?? 'text-muted-foreground')} aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  )
}

export async function MetricsRow() {
  const counts = await getDashboardCounts()
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard label="In production" value={counts.jobs_in_production} Icon={Factory} iconClassName="text-primary" />
      <MetricCard label="On hold" value={counts.jobs_on_hold} Icon={PauseCircle} />
      <MetricCard label="Overdue" value={counts.jobs_overdue} Icon={AlertCircle} iconClassName="text-destructive" />
      <MetricCard label="Due this week" value={counts.jobs_due_this_week} Icon={CalendarClock} />
    </div>
  )
}
