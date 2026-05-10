import { getActiveWorkstations } from '@/modules/dashboard'
import { PRODUCTION_LABEL } from '@/modules/jobs'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Activity, Clock } from 'lucide-react'
import { RelativeTime } from './relative-time'

export async function ActiveWorkstationsCard() {
  const stations = await getActiveWorkstations()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" aria-hidden="true" />
          Active workstations
          {stations.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({stations.length} in last 5 min)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stations.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No workstations active in the last 5 minutes.
          </div>
        ) : (
          <ul className="space-y-4">
            {stations.map((station) => (
              <li
                key={station.id}
                className="flex items-start justify-between border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{station.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {station.default_stage
                      ? PRODUCTION_LABEL[station.default_stage] ?? station.default_stage
                      : 'Any stage'}
                  </p>
                </div>
                <div className="flex items-center whitespace-nowrap text-xs text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" aria-hidden="true" />
                  <RelativeTime iso={station.last_activity_at} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
