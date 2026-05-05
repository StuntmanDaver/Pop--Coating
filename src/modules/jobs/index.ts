// Public API for the Jobs module.
// docs/DESIGN.md §4.3 Module 3 (Jobs). Status transitions are owned by the scanning
// module (record_scan_event); this surface intentionally never writes production_status.

export { createJob, updateJob, setJobHold, archiveJob } from './actions/jobs'
export type { CreateJobInput, UpdateJobInput } from './actions/jobs'

export { listJobs, getJobById, getJobByPacketToken } from './queries/jobs'
export type { ListJobsParams, JobListItem } from './queries/jobs'
