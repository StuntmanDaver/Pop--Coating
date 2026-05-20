'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { PinPad } from '../_components/pin-pad'

interface PinClientProps {
  employeeId: string
  workstationId: string
  workstationVersion: number
  packetToken?: string
}

function routeWithOptionalPacket(path: '/scan' | '/scan/lookup', packetToken?: string): Route {
  if (!packetToken) return path
  const params = new URLSearchParams({ packet: packetToken })
  return `${path}?${params.toString()}` as Route
}

export function PinClient({
  employeeId,
  workstationId,
  workstationVersion,
  packetToken,
}: PinClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handlePin(pin: string) {
    setError(null)

    let result: {
      ok: boolean
      step?: 'pin' | 'claim'
      reason?: string
      attempts_remaining?: number
      until?: string
    }
    try {
      const response = await fetch('/scan/pin/claim', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          workstation_id: workstationId,
          expected_version: workstationVersion,
          pin,
        }),
      })
      result = await response.json()
    } catch {
      setError('Unable to verify PIN. Please try again.')
      return
    }

    if (!result.ok && result.step === 'pin') {
      switch (result.reason) {
        case 'invalid_pin':
          setError(
            `Wrong PIN. ${result.attempts_remaining ?? 0} attempt${result.attempts_remaining === 1 ? '' : 's'} remaining.`,
          )
          break
        case 'locked': {
          const lockedUntil = new Date(result.until ?? Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
          setError(`Account locked until ${lockedUntil}. Contact a manager.`)
          break
        }
        case 'inactive':
          setError('Account inactive — see a manager.')
          break
        case 'tenant_mismatch':
        default:
          setError('Unable to verify.')
          break
      }
      return
    }

    if (!result.ok && result.reason === 'workstation_in_use_or_stale_version') {
      // Bounce to /scan so the boot screen re-reads the fresh workstation row
      // and picks up the latest version number.
      setError('Workstation in use — try again.')
      return
    }

    if (!result.ok) {
      setError('Unable to claim workstation. Please try again.')
      return
    }

    // Store employee context in sessionStorage for /scan/station
    sessionStorage.setItem('scan:employee_id', employeeId)

    startTransition(() => {
      router.push(
        packetToken
          ? routeWithOptionalPacket('/scan/lookup', packetToken)
          : '/scan/station',
      )
    })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Enter PIN</h1>
        <p className="mt-1 text-sm text-zinc-400">4-digit PIN</p>
      </div>
      <PinPad onSubmit={handlePin} disabled={isPending} error={error} />
      <button
        type="button"
        onClick={() => router.push(routeWithOptionalPacket('/scan', packetToken))}
        disabled={isPending}
        className="min-h-11 rounded-md px-3 text-sm text-zinc-400 hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50"
      >
        Cancel — Back to Employee List
      </button>
    </main>
  )
}
