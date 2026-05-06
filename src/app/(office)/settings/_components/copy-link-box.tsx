'use client'
import { useState } from 'react'

export function CopyLinkBox({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        readOnly
        value={value}
        aria-label={label}
        className="flex-1 rounded-md border border-input bg-background px-3 py-2 font-mono text-xs text-foreground shadow-sm"
      />
      <button
        type="button"
        onClick={handleCopy}
        className="whitespace-nowrap rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}
