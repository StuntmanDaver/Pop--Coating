import { notFound } from 'next/navigation'
import { requireShopStaff } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'
import { createClient } from '@/shared/db/server'
import { LookupClient } from './lookup-client'

interface Props {
  searchParams: Promise<{ job?: string }>
}

export default async function LookupPage({ searchParams }: Props) {
  await requireShopStaff()
  const claims = await getCurrentClaims()
  const params = await searchParams
  const jobId = params.job ?? ''

  if (!jobId || !claims.workstation_id) {
    const { redirect } = await import('next/navigation')
    redirect('/scan/station')
  }

  const supabase = await createClient()
  const { data: job, error } = await supabase
    .from('jobs')
    .select('id, job_number, job_name, production_status, intake_status, on_hold, hold_reason')
    .eq('id', jobId)
    .maybeSingle()

  if (error || !job) notFound()

  const workstationId = claims.workstation_id
  if (!workstationId) notFound()

  return <LookupClient job={job} workstationId={workstationId} />
}
