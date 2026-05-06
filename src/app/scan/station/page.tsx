'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { releaseWorkstation, lookupJobByPacketToken } from '@/modules/scanning'
import { HeartbeatProvider } from '../_components/heartbeat-provider'
import { Scanner } from '../_components/scanner'
import { ManualEntry } from '../_components/manual-entry'
import { OfflineQueueFlusher } from '../_components/offline-queue'

type Overlay = 'scanner' | 'manual' | null

export default function StationPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [employeeId, setEmployeeId] = useState<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('scan:employee_id')
    if (!stored) {
      // No active session — return to boot screen
      router.replace('/scan')
      return
    }
    setEmployeeId(stored)
  }, [router])

  async function handleToken(token: string) {
    setLookupError(null)
    setOverlay(null)
    try {
      const job = await lookupJobByPacketToken({ token_or_prefix: token })
      if (!job) {
        setLookupError('Job not found. Check the code and try again.')
        return
      }
      startTransition(() => {
        router.push(`/scan/lookup?job=${job.id}`)
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lookup failed.'
      if (msg.toLowerCase().includes('ambiguous')) {
        setLookupError('Code is ambiguous — enter more characters.')
        setOverlay('manual')
      } else {
        setLookupError(msg)
      }
    }
  }

  async function handleSwitchUser() {
    sessionStorage.removeItem('scan:employee_id')
    try {
      await releaseWorkstation()
    } catch {
      // Release is best-effort; continue regardless
    }
    startTransition(() => {
      router.replace('/scan')
    })
  }

  if (!employeeId) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" aria-label="Loading" />
      </main>
    )
  }

  return (
    <HeartbeatProvider>
      <OfflineQueueFlusher />
      <main className="flex min-h-screen flex-col">
        <header className="border-b border-zinc-800 bg-zinc-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Scan Station</span>
            <button
              type="button"
              onClick={handleSwitchUser}
              disabled={isPending}
              className="text-sm text-zinc-500 hover:text-zinc-300 disabled:opacity-50"
            >
              Switch User
            </button>
          </div>
        </header>

        {overlay === 'scanner' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
            <div className="w-full max-w-sm rounded-2xl bg-zinc-900 p-6">
              <Scanner onScan={handleToken} onClose={() => setOverlay(null)} />
            </div>
          </div>
        )}

        {overlay === 'manual' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6">
            <div className="w-full max-w-sm rounded-2xl bg-zinc-900 p-6">
              <h2 className="mb-4 text-lg font-semibold">Enter Job Code</h2>
              <ManualEntry
                onSubmit={handleToken}
                onClose={() => setOverlay(null)}
                disabled={isPending}
              />
            </div>
          </div>
        )}

        <section className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
          <div className="text-center">
            <p className="text-sm uppercase tracking-widest text-zinc-500">Ready to Scan</p>
          </div>

          {lookupError && (
            <div
              role="alert"
              className="w-full max-w-sm rounded-xl border border-red-800 bg-red-950 px-4 py-3 text-center text-sm text-red-300"
            >
              {lookupError}
            </div>
          )}

          <div className="flex w-full max-w-sm flex-col gap-4">
            <button
              type="button"
              onClick={() => {
                setLookupError(null)
                setOverlay('scanner')
              }}
              disabled={isPending}
              className="flex h-24 items-center justify-center rounded-2xl bg-white text-xl font-semibold text-black hover:bg-zinc-200 disabled:opacity-50"
            >
              Scan QR Code
            </button>
            <button
              type="button"
              onClick={() => {
                setLookupError(null)
                setOverlay('manual')
              }}
              disabled={isPending}
              className="flex h-16 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 text-base font-medium hover:bg-zinc-800 disabled:opacity-50"
            >
              Manual Entry
            </button>
          </div>
        </section>
      </main>
    </HeartbeatProvider>
  )
}
