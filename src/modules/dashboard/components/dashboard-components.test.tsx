import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ActiveWorkstationsCard } from './active-workstations-card'
import { OperationsSummary } from './operations-summary'
import { RecentJobsCard } from './recent-jobs-card'
import type { ActiveWorkstation, DashboardCounts, RecentJob } from '../queries/dashboard'

const baseCounts: DashboardCounts = {
  jobs_in_production: 4,
  jobs_on_hold: 1,
  jobs_overdue: 2,
  jobs_due_this_week: 3,
}

const baseJobs: RecentJob[] = [
  {
    id: 'job-1',
    job_number: 'POPS-2026-00001',
    job_name: 'North gate railings',
    intake_status: 'in_production',
    production_status: 'coating',
    on_hold: false,
    due_date: '2026-05-12',
    priority: 'rush',
    created_at: '2026-05-06T13:00:00Z',
  },
  {
    id: 'job-2',
    job_number: 'POPS-2026-00002',
    job_name: 'Pump housings',
    intake_status: 'scheduled',
    production_status: null,
    on_hold: true,
    due_date: null,
    priority: 'normal',
    created_at: '2026-05-06T12:00:00Z',
  },
]

const baseStations: ActiveWorkstation[] = [
  {
    id: 'station-1',
    name: 'Coating booth',
    default_stage: 'coating',
    last_activity_at: '2026-05-06T14:28:00Z',
    current_employee_id: 'employee-1',
  },
]

const now = new Date('2026-05-06T14:30:00Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(now)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('RecentJobsCard', () => {
  it('renders production and hold status visibility for recent jobs', () => {
    render(<RecentJobsCard jobs={baseJobs} />)

    expect(screen.getByRole('link', { name: 'POPS-2026-00001' })).toHaveAttribute('href', '/jobs/job-1')
    expect(screen.getByText('Coating')).toBeInTheDocument()
    expect(screen.getByText('On hold')).toBeInTheDocument()
    expect(screen.getByText('rush')).toBeInTheDocument()
    expect(screen.getByText('No date')).toBeInTheDocument()
  })

  it('renders an empty state when there are no recent jobs', () => {
    render(<RecentJobsCard jobs={[]} />)

    expect(screen.getByText('No open jobs yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View all/i })).toHaveAttribute('href', '/jobs')
  })
})

describe('ActiveWorkstationsCard', () => {
  it('renders active workstation stage, heartbeat, and claimed state', () => {
    render(<ActiveWorkstationsCard stations={baseStations} now={now} />)

    expect(screen.getByText('Coating booth')).toBeInTheDocument()
    expect(screen.getByText('Coating')).toBeInTheDocument()
    expect(screen.getByText('2m ago')).toBeInTheDocument()
    expect(screen.getByText('Claimed')).toBeInTheDocument()
  })

  it('renders an empty state when no stations are active', () => {
    render(<ActiveWorkstationsCard stations={[]} now={now} />)

    expect(screen.getByText('No scan stations active')).toBeInTheDocument()
  })
})

describe('OperationsSummary', () => {
  it('summarizes scan visibility and attention queue from dashboard query results', () => {
    render(<OperationsSummary counts={baseCounts} jobs={baseJobs} stations={baseStations} now={now} />)

    expect(screen.getByText('Active scan stations')).toBeInTheDocument()
    expect(screen.getByText('Recent jobs with stage')).toBeInTheDocument()
    expect(screen.getByText('Attention queue')).toBeInTheDocument()
    expect(screen.getAllByText('1', { selector: 'p' })).toHaveLength(2)
    expect(screen.getByText('/ 2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
