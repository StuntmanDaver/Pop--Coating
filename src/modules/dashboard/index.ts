// Public API for the Dashboard module.
// docs/DESIGN.md §4.3 Module 7 (Dashboard). Read-only aggregations over jobs,
// workstations, and scan history. All scoped by RLS to the caller's tenant.

export { getDashboardCounts, getRecentJobs, getActiveWorkstations } from './queries/dashboard'
export type { DashboardCounts, RecentJob, ActiveWorkstation } from './queries/dashboard'
export { DashboardPage } from './components/dashboard-page'
export { DashboardLoading } from './components/dashboard-loading'
