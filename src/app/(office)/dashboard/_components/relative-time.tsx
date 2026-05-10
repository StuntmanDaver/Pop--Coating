'use client'

import { useEffect, useState } from 'react'

function formatRelative(iso: string | null, now: number): string {
  if (!iso) return 'Never'
  const ms = new Date(iso).getTime()
  if (Number.isNaN(ms)) return 'Unknown'
  const seconds = Math.round((now - ms) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function RelativeTime({ iso }: { iso: string | null }) {
  // Initial render uses page-load time so SSR and first client render agree.
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <time dateTime={iso ?? undefined} suppressHydrationWarning>
      {formatRelative(iso, now)}
    </time>
  )
}
