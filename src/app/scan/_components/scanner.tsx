'use client'

import { useEffect, useRef, useState } from 'react'

interface ScannerProps {
  onScan: (token: string) => void
  onClose: () => void
}

export function Scanner({ onScan, onClose }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let codeReader: import('@zxing/browser').BrowserQRCodeReader | null = null
    let stopped = false

    async function start() {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser')
        codeReader = new BrowserQRCodeReader()

        const devices = await BrowserQRCodeReader.listVideoInputDevices()
        // Prefer back/environment camera on iPad
        const envCamera =
          devices.find((d) => d.label.toLowerCase().includes('back')) ??
          devices.find((d) => d.label.toLowerCase().includes('environment')) ??
          devices[devices.length - 1]

        if (!envCamera) {
          setError('No camera found on this device.')
          return
        }

        await codeReader.decodeFromVideoDevice(
          envCamera.deviceId,
          videoRef.current!,
          (result, err) => {
            if (stopped) return
            if (result) {
              const text = result.getText()
              // QR codes encode the full packet_token; extract it
              const token = text.includes('/') ? text.split('/').pop() ?? text : text
              onScan(token.trim())
            }
            if (err && !(err instanceof Error && err.message.includes('NotFoundException'))) {
              // NotFoundException fires every frame when no QR found — ignore
              setError(String(err))
            }
          }
        )
      } catch (err: unknown) {
        if (err instanceof Error && err.message.toLowerCase().includes('permission')) {
          setPermissionDenied(true)
        } else {
          setError(err instanceof Error ? err.message : 'Camera failed to start.')
        }
      }
    }

    start()

    return () => {
      stopped = true
      codeReader?.reset()
    }
  }, [onScan])

  if (permissionDenied) {
    return (
      <div className="flex flex-col items-center gap-6 p-8 text-center">
        <p className="text-lg font-medium">Camera Access Denied</p>
        <p className="text-sm text-zinc-400">
          Allow camera access in Settings, or use manual entry instead.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-zinc-800 px-6 py-3 text-sm font-medium hover:bg-zinc-700"
        >
          Use Manual Entry
        </button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-6 p-8 text-center">
        <p className="text-red-400">{error}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-zinc-800 px-6 py-3 text-sm font-medium hover:bg-zinc-700"
        >
          Close
        </button>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col items-center gap-4">
      <p className="text-sm text-zinc-400">Point camera at the QR code on the job packet</p>
      <div className="relative overflow-hidden rounded-2xl">
        <video
          ref={videoRef}
          className="h-72 w-72 object-cover"
          aria-label="QR code scanner viewfinder"
          playsInline
          muted
        />
        {/* Targeting reticle */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-48 w-48 rounded-lg border-2 border-white/60" />
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 rounded-xl bg-zinc-800 px-6 py-3 text-sm font-medium hover:bg-zinc-700"
      >
        Cancel
      </button>
    </div>
  )
}
