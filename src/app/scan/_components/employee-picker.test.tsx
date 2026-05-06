import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

import { EmployeePicker } from './employee-picker'
import type { ShopEmployeeTile } from '@/modules/scanning'

function makeEmployees(count: number): ShopEmployeeTile[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `emp-${i + 1}`,
    display_name: `Employee ${i + 1}`,
    avatar_url: null,
    is_active: true,
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('EmployeePicker', () => {
  it('renders employee tiles for each employee', () => {
    const employees = makeEmployees(3)
    render(<EmployeePicker employees={employees} workstationVersion={1} />)

    // Tiles have role="listitem" set explicitly on the button element
    expect(screen.getByRole('listitem', { name: /Select Employee 1/i })).toBeInTheDocument()
    expect(screen.getByRole('listitem', { name: /Select Employee 2/i })).toBeInTheDocument()
    expect(screen.getByRole('listitem', { name: /Select Employee 3/i })).toBeInTheDocument()
  })

  it('shows filter input when employee count exceeds 12', () => {
    const employees = makeEmployees(13)
    render(<EmployeePicker employees={employees} workstationVersion={1} />)

    expect(screen.getByRole('searchbox', { name: /Filter employees/i })).toBeInTheDocument()
  })

  it('hides filter input when employee count is 12 or fewer', () => {
    const employees = makeEmployees(12)
    render(<EmployeePicker employees={employees} workstationVersion={1} />)

    expect(screen.queryByRole('searchbox', { name: /Filter employees/i })).not.toBeInTheDocument()
  })

  it('filters visible tiles based on filter input', () => {
    const employees: ShopEmployeeTile[] = [
      { id: 'emp-1', display_name: 'Alice Smith', avatar_url: null, is_active: true },
      { id: 'emp-2', display_name: 'Bob Jones', avatar_url: null, is_active: true },
      ...makeEmployees(11).map((e, i) => ({ ...e, id: `extra-${i}`, display_name: `Extra ${i}` })),
    ]
    render(<EmployeePicker employees={employees} workstationVersion={1} />)

    const filterInput = screen.getByRole('searchbox', { name: /Filter employees/i })
    fireEvent.change(filterInput, { target: { value: 'Alice' } })

    expect(screen.getByRole('listitem', { name: /Select Alice Smith/i })).toBeInTheDocument()
    expect(screen.queryByRole('listitem', { name: /Select Bob Jones/i })).not.toBeInTheDocument()
  })

  it('shows empty state when employees array is empty', () => {
    render(<EmployeePicker employees={[]} workstationVersion={1} />)

    expect(screen.getByText('No employees found.')).toBeInTheDocument()
    expect(screen.getByText('Contact a manager to add employees.')).toBeInTheDocument()
  })

  it('calls router.push with correct emp and v params when tile is clicked', () => {
    const employees: ShopEmployeeTile[] = [
      { id: 'emp-abc', display_name: 'Alice', avatar_url: null, is_active: true },
    ]
    render(<EmployeePicker employees={employees} workstationVersion={7} />)

    fireEvent.click(screen.getByRole('listitem', { name: /Select Alice/i }))

    expect(mockPush).toHaveBeenCalledWith('/scan/pin?emp=emp-abc&v=7')
  })

  it('shows avatar image when avatar_url is set', () => {
    const employees: ShopEmployeeTile[] = [
      { id: 'emp-1', display_name: 'Alice', avatar_url: 'https://example.com/alice.jpg', is_active: true },
    ]
    render(<EmployeePicker employees={employees} workstationVersion={1} />)

    // img has aria-hidden="true" so we query by element
    const img = document.querySelector('img') as HTMLImageElement
    expect(img).not.toBeNull()
    expect(img.getAttribute('src')).toBe('https://example.com/alice.jpg')
  })

  it('shows initial letter avatar when avatar_url is null', () => {
    const employees: ShopEmployeeTile[] = [
      { id: 'emp-1', display_name: 'Bob', avatar_url: null, is_active: true },
    ]
    render(<EmployeePicker employees={employees} workstationVersion={1} />)

    expect(screen.getByText('B')).toBeInTheDocument()
  })
})
