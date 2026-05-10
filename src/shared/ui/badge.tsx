import * as React from 'react'
import { cn } from '@/lib/utils'

// Lightweight inline badge — avoids pulling another shadcn dep for a one-element widget.
// Variants map to semantic states common in this app (statuses, priorities).
export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'muted'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-primary/15 text-primary-foreground/90 ring-1 ring-primary/40',
  success: 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300',
  warning: 'bg-amber-100 text-amber-900 ring-1 ring-amber-300',
  danger: 'bg-rose-100 text-rose-900 ring-1 ring-rose-300',
  muted: 'bg-muted/10 text-foreground/70 ring-1 ring-border',
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ variant = 'default', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tracking-wide',
        VARIANT_CLASSES[variant],
        className
      )}
      {...rest}
    />
  )
}
