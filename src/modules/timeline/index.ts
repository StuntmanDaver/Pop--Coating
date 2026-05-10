// Public API for the Timeline module.
// docs/DESIGN.md §4.3 Module 6 (Timeline). Read-only aggregator over job_status_history.
// getCustomerVisibleTimeline is the customer-portal entry point (defense-in-depth filter
// on customer_visible=true alongside RLS).

export {
  getJobTimeline,
  getCustomerVisibleTimeline,
  getEmployeeScanHistory,
} from './queries/timeline'
export type {
  TimelineEvent,
  GetJobTimelineParams,
  GetEmployeeScanHistoryParams,
} from './queries/timeline'
