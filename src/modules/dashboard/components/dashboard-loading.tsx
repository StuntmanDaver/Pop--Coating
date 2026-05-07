import { Card, CardContent, CardHeader } from '@/shared/ui/card'

function MetricSkeleton() {
  return (
    <Card className="rounded-md">
      <CardHeader className="pb-3">
        <div className="h-3 w-24 animate-pulse rounded bg-border" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-8 w-16 animate-pulse rounded bg-border" />
        <div className="h-3 w-32 animate-pulse rounded bg-border/70" />
      </CardContent>
    </Card>
  )
}

function PanelSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className} aria-hidden="true">
      <CardHeader>
        <div className="h-5 w-40 animate-pulse rounded bg-border" />
        <div className="h-3 w-56 animate-pulse rounded bg-border/70" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-md bg-border/70" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardLoading() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="h-8 w-56 animate-pulse rounded bg-border" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-border/70" />
        </div>
        <div className="h-9 w-32 animate-pulse rounded-md bg-border" />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <MetricSkeleton key={index} />
        ))}
      </div>

      <PanelSkeleton />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <PanelSkeleton />
        <PanelSkeleton />
      </div>
    </div>
  )
}
