import { notFound } from 'next/navigation'
import { requireShopStaff } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'
import { PinClient } from './pin-client'

interface Props {
  searchParams: Promise<{ emp?: string; v?: string }>
}

export default async function PinPage({ searchParams }: Props) {
  await requireShopStaff()
  const claims = await getCurrentClaims()
  const params = await searchParams
  const employeeId = params.emp ?? ''
  const workstationVersion = Number(params.v ?? '0')

  if (!employeeId || !claims.workstation_id) {
    const { redirect } = await import('next/navigation')
    redirect('/scan')
  }

  const workstationId = claims.workstation_id
  if (!workstationId) notFound()

  return (
    <PinClient
      employeeId={employeeId}
      workstationId={workstationId}
      workstationVersion={workstationVersion}
    />
  )
}
