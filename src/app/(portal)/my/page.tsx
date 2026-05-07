import { listMyJobs, PortalJobsList } from '@/modules/portal'

export default async function CustomerJobsPage() {
  const jobs = await listMyJobs({ limit: 100, offset: 0 })
  return <PortalJobsList jobs={jobs} />
}
