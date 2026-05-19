import { Activity, Clock, Radio } from 'lucide-react'
import { PRODUCTION_LABEL } from '@/modules/jobs'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import type { ActiveWorkstation } from '../queries/dashboard'
import { RelativeTime } from './relative-time'

type Props = {
  stations: ActiveWorkstation[]
  now: Date
}

export function ActiveWorkstationsCard({ stations, now }: Props) {
  return (
    <Card className="rounded-md">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
          Active workstations
        </CardTitle>
        <p className="text-xs text-muted-foreground">Tablets with heartbeat activity in the last 5 minutes.</p>
      </CardHeader>
      <CardContent className="p-0">
        {stations.length === 0 ? (
          <div className="m-5 rounded-md border border-dashed border-border p-8 text-center">
            <p className="text-sm font-medium">No scan stations active</p>
            <p className="mt-1 text-sm text-muted-foreground">Station heartbeats will appear once tablets are signed in.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {stations.map((station) => (
              <li key={station.id} className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                    <p className="truncate text-sm font-medium leading-none">{station.name}</p>
                  </div>
                  <Badge variant="muted">
                    {station.default_stage
                      ? PRODUCTION_LABEL[station.default_stage] ?? station.default_stage
                      : 'Any stage'}
                  </Badge>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <RelativeTime iso={station.last_activity_at} now={now} />
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Radio className="h-3 w-3" aria-hidden="true" />
                    {station.current_employee_id ? 'Claimed' : 'Unclaimed'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
