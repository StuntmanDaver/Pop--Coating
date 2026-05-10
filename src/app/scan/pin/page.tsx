import { notFound } from 'next/navigation'
import { requireShopStaff } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'
import { PinClient } from './pin-client'
import type { Route } from 'next'

interface Props {
  searchParams: Promise<{ emp?: string; packet?: string; v?: string }>
}

function scanHref(packetToken?: string): Route {
  if (!packetToken) return '/scan'
  const params = new URLSearchParams({ packet: packetToken })
  return `/scan?${params.toString()}` as Route
}

export default async function PinPage({ searchParams }: Props) {
  await requireShopStaff()
  const claims = await getCurrentClaims()
  const params = await searchParams
  const employeeId = params.emp ?? ''
  const packetToken = params.packet?.trim() || undefined
  const workstationVersion = Number(params.v ?? '0')

  if (!employeeId || !claims.workstation_id) {
    const { redirect } = await import('next/navigation')
    redirect(scanHref(packetToken))
  }

  const workstationId = claims.workstation_id
  if (!workstationId) notFound()

  return (
    <PinClient
      employeeId={employeeId}
      workstationId={workstationId}
      workstationVersion={workstationVersion}
      packetToken={packetToken}
    />
  )
}
