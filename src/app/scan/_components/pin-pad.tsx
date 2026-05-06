'use client'

import { useState } from 'react'

interface PinPadProps {
  onSubmit: (pin: string) => void
  disabled?: boolean
  error?: string | null
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back']

export function PinPad({ onSubmit, disabled = false, error }: PinPadProps) {
  const [pin, setPin] = useState('')

  function handleKey(key: string) {
    if (disabled) return
    if (key === 'clear') {
      setPin('')
      return
    }
    if (key === 'back') {
      setPin((p) => p.slice(0, -1))
      return
    }
    if (pin.length >= 8) return
    const next = pin + key
    setPin(next)
    if (next.length >= 4) {
      // Auto-submit at 4 digits (standard PIN length)
      onSubmit(next)
      setPin('')
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* PIN dots */}
      <div className="flex gap-4" aria-live="polite" aria-label={`PIN: ${pin.length} digits entered`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full border-2 transition-colors ${
              i < pin.length ? 'border-white bg-white' : 'border-zinc-600 bg-transparent'
            }`}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3" role="group" aria-label="PIN pad">
        {KEYS.map((key) => {
          const isAction = key === 'clear' || key === 'back'
          const label = key === 'back' ? '⌫' : key === 'clear' ? 'CLR' : key
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleKey(key)}
              disabled={disabled}
              aria-label={key === 'back' ? 'Backspace' : key === 'clear' ? 'Clear' : key}
              className={`flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-40 ${
                isAction
                  ? 'bg-zinc-800 text-zinc-400 active:bg-zinc-700 hover:bg-zinc-700'
                  : 'bg-zinc-800 text-white active:bg-zinc-600 hover:bg-zinc-700'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
