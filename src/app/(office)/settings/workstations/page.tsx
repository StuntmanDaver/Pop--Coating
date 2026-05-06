import { createClient } from '@/shared/db/server'
import { Badge } from '@/shared/ui/badge'
import { CreateWorkstationPanel } from './create-workstation-panel'

interface WorkstationRow {
  id: string
  name: string
  default_stage: string | null
  physical_location: string | null
  last_activity_at: string | null
  is_active: boolean
  current_employee: { display_name: string } | null
}

export default async function WorkstationsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workstations')
    .select(`
      id, name, default_stage, physical_location, last_activity_at, is_active,
      current_employee:shop_employees!current_employee_id(display_name)
    `)
    .order('name', { ascending: true })

  if (error) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Failed to load workstations: {error.message}
      </div>
    )
  }

  const workstations = (data ?? []) as WorkstationRow[]

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Workstations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {workstations.length === 0
              ? 'No workstations yet.'
              : `${workstations.length} ${workstations.length === 1 ? 'workstation' : 'workstations'}.`}
          </p>
        </div>
      </div>

      {workstations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-16 text-center">
          <p className="text-sm text-muted-foreground">
            No workstations yet. Create your first one below.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/5">
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-4 py-3 font-medium">Name</th>
                <th scope="col" className="px-4 py-3 font-medium">Default stage</th>
                <th scope="col" className="px-4 py-3 font-medium">Location</th>
                <th scope="col" className="px-4 py-3 font-medium">Current employee</th>
                <th scope="col" className="px-4 py-3 font-medium">Last active</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {workstations.map((ws) => (
                <tr key={ws.id} className={ws.is_active ? 'hover:bg-muted/5' : 'opacity-60 hover:bg-muted/5'}>
                  <td className="px-4 py-3 font-medium text-foreground">{ws.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{ws.default_stage ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{ws.physical_location ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ws.current_employee?.display_name ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {ws.last_activity_at
                      ? new Date(ws.last_activity_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {ws.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="warning">Inactive</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateWorkstationPanel />
    </div>
  )
}
