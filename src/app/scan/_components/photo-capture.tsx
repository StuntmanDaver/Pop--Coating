'use client'

import { useRef, useState } from 'react'

interface PhotoCaptureProps {
  onCapture: (blob: Blob) => void
  onClear: () => void
  capturedBlob: Blob | null
}

// Compression: JPEG 0.7, max 1024px longest edge (per DESIGN.md photo standard).
// UPLOAD IS DEFERRED — this brief captures + previews only.
export async function compressPhoto(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const { width, height } = img
      const maxDim = 1024
      const scale = Math.min(maxDim / width, maxDim / height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Canvas context unavailable'))
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        'image/jpeg',
        0.7
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image load failed'))
    }
    img.src = url
  })
}

export function PhotoCapture({ onCapture, onClear, capturedBlob }: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [compressing, setCompressing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setCompressing(true)
    setError(null)
    try {
      const compressed = await compressPhoto(file)
      const url = URL.createObjectURL(compressed)
      setPreviewUrl(url)
      onCapture(compressed)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Photo capture failed.')
    } finally {
      setCompressing(false)
    }
  }

  function handleClear() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    onClear()
    if (inputRef.current) inputRef.current.value = ''
  }

  if (capturedBlob && previewUrl) {
    return (
      <div className="flex flex-col gap-3">
        <img
          src={previewUrl}
          alt="Captured photo preview"
          className="max-h-48 rounded-xl object-contain"
        />
        <button
          type="button"
          onClick={handleClear}
          className="rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-sm text-zinc-400 hover:bg-zinc-800"
        >
          Remove Photo
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-label="Take or upload a photo"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={compressing}
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-900 py-4 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
      >
        {compressing ? 'Processing…' : '+ Add Photo (optional)'}
      </button>
      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
