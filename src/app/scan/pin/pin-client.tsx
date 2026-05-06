'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { validateEmployeePin, claimWorkstation } from '@/modules/scanning'
import { PinPad } from '../_components/pin-pad'

interface PinClientProps {
  employeeId: string
  workstationId: string
  workstationVersion: number
}

export function PinClient({ employeeId, workstationId, workstationVersion }: PinClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handlePin(pin: string) {
    setError(null)

    // Step 1: validate PIN
    let pinResult: Awaited<ReturnType<typeof validateEmployeePin>>
    try {
      pinResult = await validateEmployeePin({ employee_id: employeeId, pin })
    } catch {
      setError('Unable to verify PIN. Please try again.')
      return
    }

    if (!pinResult.ok) {
      switch (pinResult.reason) {
        case 'invalid_pin':
          setError(
            `Wrong PIN. ${pinResult.attempts_remaining} attempt${pinResult.attempts_remaining === 1 ? '' : 's'} remaining.`,
          )
          break
        case 'locked': {
          const lockedUntil = new Date(pinResult.until).toLocaleTimeString([], {
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

    // Step 2: claim workstation — workstation_id always comes from JWT claims,
    // never from URL params. The SQL SECURITY DEFINER function enforces this invariant.
    let claimResult: Awaited<ReturnType<typeof claimWorkstation>>
    try {
      claimResult = await claimWorkstation({
        workstation_id: workstationId,
        employee_id: employeeId,
        expected_version: workstationVersion,
      })
    } catch {
      setError('Failed to claim workstation. Please try again.')
      return
    }

    if (!claimResult.ok && claimResult.reason === 'workstation_in_use_or_stale_version') {
      // Bounce to /scan so the boot screen re-reads the fresh workstation row
      // and picks up the latest version number.
      setError('Workstation in use — try again.')
      return
    }

    if (!claimResult.ok) {
      setError('Unable to claim workstation. Please try again.')
      return
    }

    // Store employee context in sessionStorage for /scan/station
    sessionStorage.setItem('scan:employee_id', employeeId)

    startTransition(() => {
      router.push('/scan/station')
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
        onClick={() => router.push('/scan')}
        disabled={isPending}
        className="text-sm text-zinc-500 hover:text-zinc-300 disabled:opacity-50"
      >
        Cancel — Back to Employee List
      </button>
    </main>
  )
}
