'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { recordScanEvent } from '@/modules/scanning'
import type { RecordScanEventInput } from '@/modules/scanning'
import { StagePicker } from '../_components/stage-picker'
import type { ProductionStage } from '../_components/stage-picker'
import { PhotoCapture } from '../_components/photo-capture'

interface Job {
  id: string
  job_number: string
  job_name: string
  production_status: string | null
  intake_status: string
  on_hold: boolean
  hold_reason: string | null
}

interface LookupClientProps {
  job: Job
  workstationId: string
}

export function LookupClient({ job, workstationId }: LookupClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedStage, setSelectedStage] = useState<ProductionStage | null>(null)
  const [notes, setNotes] = useState('')
  const [photoBlobState, setPhotoBlobState] = useState<Blob | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [employeeId, setEmployeeId] = useState<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('scan:employee_id')
    if (!stored) {
      router.replace('/scan')
      return
    }
    setEmployeeId(stored)
  }, [router])

  async function handleConfirm() {
    if (!selectedStage || !employeeId) return
    setSubmitError(null)

    const input: RecordScanEventInput = {
      job_id: job.id,
      to_status: selectedStage,
      employee_id: employeeId,
      workstation_id: workstationId,
      notes: notes.trim() || undefined,
      // attachment_id intentionally omitted — photo upload pipeline deferred to Wave 2
    }

    try {
      await recordScanEvent(input)
      startTransition(() => {
        router.push('/scan/station')
      })
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Scan failed. Please try again.')
    }
  }

  if (!employeeId) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white"
          aria-label="Loading"
        />
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-800 bg-zinc-900 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/scan/station')}
            className="text-sm text-zinc-500 hover:text-zinc-300"
            aria-label="Back to station"
          >
            ← Back
          </button>
          <h1 className="text-base font-semibold">
            #{job.job_number} — {job.job_name}
          </h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
        {/* Hold warning */}
        {job.on_hold && (
          <div
            role="alert"
            className="rounded-xl border border-amber-700 bg-amber-950 px-4 py-3"
          >
            <p className="text-sm font-semibold text-amber-400">Job on Hold</p>
            {job.hold_reason && (
              <p className="mt-1 text-sm text-amber-300">{job.hold_reason}</p>
            )}
          </div>
        )}

        {/* Current status */}
        <div className="text-sm text-zinc-400">
          Current stage:{' '}
          <span className="font-medium text-white">
            {job.production_status ?? 'Not started'}
          </span>
        </div>

        {/* Stage picker */}
        <section>
          <h2 className="mb-3 text-base font-medium">Move to Stage</h2>
          <StagePicker
            currentStage={job.production_status}
            onSelect={setSelectedStage}
            disabled={isPending}
          />
          {selectedStage && (
            <p className="mt-2 text-sm text-zinc-400">
              Selected: <span className="font-medium text-white">{selectedStage}</span>
            </p>
          )}
        </section>

        {/* Photo capture */}
        <section>
          <h2 className="mb-3 text-base font-medium">Photo (Optional)</h2>
          <PhotoCapture
            onCapture={setPhotoBlobState}
            onClear={() => setPhotoBlobState(null)}
            capturedBlob={photoBlobState}
          />
        </section>

        {/* Notes */}
        <section>
          <label htmlFor="scan-notes" className="mb-2 block text-base font-medium">
            Notes (Optional)
          </label>
          <textarea
            id="scan-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 2000))}
            disabled={isPending}
            placeholder="Add notes about this stage…"
            maxLength={2000}
            rows={3}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50"
          />
          <p className="mt-1 text-xs text-zinc-500">{notes.length}/2000</p>
        </section>

        {/* Error */}
        {submitError && (
          <div
            role="alert"
            className="rounded-xl border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300"
          >
            {submitError}
          </div>
        )}

        {/* Confirm */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedStage || isPending}
          className="w-full rounded-2xl bg-white py-5 text-lg font-semibold text-black hover:bg-zinc-200 disabled:opacity-40"
        >
          {isPending ? 'Recording…' : 'Confirm Scan'}
        </button>
      </div>
    </main>
  )
}
