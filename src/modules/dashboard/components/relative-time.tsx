type Props = {
  iso: string | null
  now: Date
}

export function RelativeTime({ iso, now }: Props) {
  if (!iso) return <span>Never</span>

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return <span>Unknown</span>

  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000))

  if (diffMinutes < 1) return <span>Just now</span>
  if (diffMinutes < 60) return <span>{diffMinutes}m ago</span>

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return <span>{diffHours}h ago</span>

  const diffDays = Math.floor(diffHours / 24)
  return <span>{diffDays}d ago</span>
}
