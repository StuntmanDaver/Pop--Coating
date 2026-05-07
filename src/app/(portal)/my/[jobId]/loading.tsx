export default function PortalJobDetailLoading() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6 sm:p-8" aria-busy="true">
      <div className="h-10 w-28 rounded bg-muted/40" />
      <div className="space-y-3">
        <div className="h-3 w-36 rounded bg-muted/40" />
        <div className="h-9 w-72 max-w-full rounded bg-muted/60" />
        <div className="flex gap-2">
          <div className="h-5 w-20 rounded-full bg-muted/40" />
          <div className="h-5 w-20 rounded-full bg-muted/30" />
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="h-3 w-24 rounded bg-muted/40" />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-3 w-16 rounded bg-muted/30" />
              <div className="h-4 w-28 rounded bg-muted/50" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="h-3 w-20 rounded bg-muted/40" />
        <div className="mt-5 space-y-5">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="border-l-2 border-border pl-4">
              <div className="h-4 w-44 rounded bg-muted/50" />
              <div className="mt-2 h-3 w-28 rounded bg-muted/30" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
