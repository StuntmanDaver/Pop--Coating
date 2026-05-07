export default function CustomerJobsLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6 sm:p-8" aria-busy="true">
      <div className="space-y-3">
        <div className="h-3 w-28 rounded bg-muted/40" />
        <div className="h-9 w-44 rounded bg-muted/60" />
        <div className="h-4 w-72 max-w-full rounded bg-muted/40" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="grid gap-4 p-4 sm:grid-cols-5">
              <div className="space-y-2 sm:col-span-2">
                <div className="h-4 w-40 rounded bg-muted/50" />
                <div className="h-3 w-28 rounded bg-muted/30" />
              </div>
              <div className="h-5 w-20 rounded-full bg-muted/40" />
              <div className="h-4 w-24 rounded bg-muted/30" />
              <div className="h-4 w-24 rounded bg-muted/30" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
