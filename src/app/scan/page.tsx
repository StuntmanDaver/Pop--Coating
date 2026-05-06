import { requireShopStaff } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'
import { createClient } from '@/shared/db/server'
import { listShopEmployees } from '@/modules/scanning/queries/employees'
import { EmployeePicker } from './_components/employee-picker'

interface WorkstationRow {
  id: string
  name: string
  version: number
  default_stage: string | null
  physical_location: string | null
}

export default async function ScanPage() {
  await requireShopStaff()
  const claims = await getCurrentClaims()

  if (!claims.workstation_id) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <h1 className="mb-3 text-2xl font-bold">iPad Not Enrolled</h1>
          <p className="text-zinc-400">
            Visit <span className="font-mono text-zinc-300">/scan/enroll</span> with the
            token from your shop admin to register this iPad.
          </p>
        </div>
      </main>
    )
  }

  const supabase = await createClient()
  const { data: workstation, error } = await supabase
    .from('workstations')
    .select('id, name, version, default_stage, physical_location')
    .eq('id', claims.workstation_id)
    .maybeSingle()

  if (error || !workstation) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <h1 className="mb-3 text-2xl font-bold">Workstation Not Found</h1>
          <p className="text-zinc-400">
            This iPad&apos;s workstation could not be loaded. Contact your shop admin.
          </p>
        </div>
      </main>
    )
  }

  const employees = await listShopEmployees()

  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-800 bg-zinc-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{workstation.name}</h1>
            {workstation.physical_location && (
              <p className="text-sm text-zinc-400">{workstation.physical_location}</p>
            )}
          </div>
          <span className="text-xs text-zinc-500 uppercase tracking-widest">Scan Station</span>
        </div>
      </header>
      <section className="flex-1 p-6">
        <h2 className="mb-6 text-xl font-medium text-zinc-300">Select Employee</h2>
        <EmployeePicker
          employees={employees}
          workstationVersion={workstation.version}
        />
      </section>
    </main>
  )
}
