// Public API for the Customer Portal module.
// docs/DESIGN.md §4.3 Module 9 (Portal). Customer-audience reads only.
// Re-exports getCustomerVisibleTimeline from the timeline module so the portal
// surface is one import for callers.
//
// Wave-1 scope: data queries only (listMyJobs, getMyJob, getCustomerVisibleTimeline).
// Office-initiated customer provisioning (inviteCustomer, sendInitialMagicLink) lands
// in Wave 2 once portal UI surfaces stabilize.

export { listMyJobs, getMyJob } from './queries/portal'
export type {
  ListMyJobsParams,
  PortalJobListItem,
  PortalJobDetail,
} from './queries/portal'

export { getCustomerVisibleTimeline } from '@/modules/timeline'
export type { TimelineEvent } from '@/modules/timeline'
