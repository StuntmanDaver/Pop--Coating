import { notFound } from 'next/navigation'
import {
  getMyJob,
  getCustomerVisibleTimeline,
  PortalJobDetailView,
} from '@/modules/portal'

interface PageProps {
  params: Promise<{ jobId: string }>
}

export default async function PortalJobDetailPage({ params }: PageProps) {
  const { jobId } = await params

  const job = await getMyJob({ id: jobId })
  if (!job) notFound()

  const events = await getCustomerVisibleTimeline({ job_id: jobId })

  return <PortalJobDetailView job={job} events={events} />
}
