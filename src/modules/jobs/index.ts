// Phase 2 module. Public API will export: createJob, getJob, listJobs, updateJob,
// archiveJob, setJobOnHold, generateJobNumber — see docs/DESIGN.md §4.3 Module 3 (Jobs).
// Note: production_status transitions are forbidden via direct UPDATE; use app.record_scan_event()
// SECURITY DEFINER function (Phase 3 scanning module).
export {}
