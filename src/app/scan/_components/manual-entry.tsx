'use client'

import { useState } from 'react'

interface ManualEntryProps {
  onSubmit: (token: string) => void
  onClose: () => void
  disabled?: boolean
}

export function ManualEntry({ onSubmit, onClose, disabled = false }: ManualEntryProps) {
  const [value, setValue] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  function handleChange(raw: string) {
    // Uppercase normalization + restrict to alphanumeric URL-safe chars
    setValue(raw.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 16))
    setValidationError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (value.length < 8) {
      setValidationError('Enter at least 8 characters.')
      return
    }
    if (value.length > 16) {
      setValidationError('Maximum 16 characters.')
      return
    }
    onSubmit(value)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="manual-token" className="text-sm text-zinc-400">
          Enter the job code printed below the QR
        </label>
        <input
          id="manual-token"
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          placeholder="8–16 characters"
          minLength={8}
          maxLength={16}
          className="font-mono rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-4 text-xl text-white uppercase tracking-widest placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50"
          aria-describedby={validationError ? 'manual-error' : undefined}
        />
        {validationError && (
          <p id="manual-error" role="alert" className="text-sm text-red-400">
            {validationError}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={disabled}
          className="flex-1 rounded-xl bg-zinc-800 py-4 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={disabled || value.length < 8}
          className="flex-1 rounded-xl bg-white py-4 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-40"
        >
          Look Up
        </button>
      </div>
    </form>
  )
}
