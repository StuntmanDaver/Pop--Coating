import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/modules/scanning', () => ({
  validateEmployeePin: vi.fn(),
  claimWorkstation: vi.fn(),
}))

import { claimWorkstation, validateEmployeePin } from '@/modules/scanning'
import { PinClient } from './pin-client'

const mockValidateEmployeePin = vi.mocked(validateEmployeePin)
const mockClaimWorkstation = vi.mocked(claimWorkstation)

function pressPin(pin: string) {
  for (const digit of pin) {
    fireEvent.click(screen.getByRole('button', { name: digit }))
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  window.sessionStorage.clear()
  mockValidateEmployeePin.mockResolvedValue({ ok: true, employee_id: 'emp-1' })
  mockClaimWorkstation.mockResolvedValue({ ok: true })
})

describe('PinClient', () => {
  it('routes to station after a successful PIN when there is no packet deep link', async () => {
    render(
      <PinClient
        employeeId="emp-1"
        workstationId="ws-1"
        workstationVersion={3}
      />,
    )

    pressPin('1234')

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/scan/station')
    })
    expect(window.sessionStorage.getItem('scan:employee_id')).toBe('emp-1')
    expect(mockValidateEmployeePin).toHaveBeenCalledWith({
      employee_id: 'emp-1',
      pin: '1234',
    })
    expect(mockClaimWorkstation).toHaveBeenCalledWith({
      workstation_id: 'ws-1',
      employee_id: 'emp-1',
      expected_version: 3,
    })
  })

  it('routes to lookup with the packet token after a successful PIN', async () => {
    render(
      <PinClient
        employeeId="emp-1"
        workstationId="ws-1"
        workstationVersion={3}
        packetToken="abc123def456ghij"
      />,
    )

    pressPin('1234')

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/scan/lookup?packet=abc123def456ghij',
      )
    })
    expect(window.sessionStorage.getItem('scan:employee_id')).toBe('emp-1')
  })

  it('preserves the packet token when canceling back to employee selection', () => {
    render(
      <PinClient
        employeeId="emp-1"
        workstationId="ws-1"
        workstationVersion={3}
        packetToken="abc123def456ghij"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))

    expect(mockPush).toHaveBeenCalledWith('/scan?packet=abc123def456ghij')
  })
})
