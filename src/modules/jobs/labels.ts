import type { BadgeVariant } from '@/shared/ui/badge'

export const PRODUCTION_LABEL: Record<string, string> = {
  received: 'Received',
  prep: 'Prep',
  coating: 'Coating',
  curing: 'Curing',
  qc: 'QC',
  completed: 'Completed',
  picked_up: 'Picked up',
}

export const INTAKE_LABEL: Record<string, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  in_production: 'In production',
  archived: 'Archived',
}

export const PRIORITY_VARIANT: Record<string, BadgeVariant> = {
  rush: 'danger',
  high: 'warning',
  normal: 'default',
  low: 'muted',
}
