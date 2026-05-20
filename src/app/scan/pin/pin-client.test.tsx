import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PinClient } from './pin-client'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

function pressPin(pin: string) {
  for (const digit of pin) {
    fireEvent.click(screen.getByRole('button', { name: digit }))
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  window.sessionStorage.clear()
  global.fetch = vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ ok: true, step: 'claim' }),
    } as Response),
  )
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
    expect(global.fetch).toHaveBeenCalledWith('/scan/pin/claim', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        employee_id: 'emp-1',
        workstation_id: 'ws-1',
        expected_version: 3,
        pin: '1234',
      }),
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

  it('shows invalid PIN attempts returned from the claim endpoint', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve({
        ok: false,
        step: 'pin',
        reason: 'invalid_pin',
        attempts_remaining: 3,
      }),
    } as Response)

    render(
      <PinClient
        employeeId="emp-1"
        workstationId="ws-1"
        workstationVersion={3}
      />,
    )

    pressPin('1234')

    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong PIN. 3 attempts remaining.')
    expect(mockPush).not.toHaveBeenCalledWith('/scan/station')
    expect(window.sessionStorage.getItem('scan:employee_id')).toBeNull()
  })

  it('shows claim failures returned from the claim endpoint', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve({
        ok: false,
        step: 'claim',
        reason: 'workstation_in_use_or_stale_version',
      }),
    } as Response)

    render(
      <PinClient
        employeeId="emp-1"
        workstationId="ws-1"
        workstationVersion={3}
      />,
    )

    pressPin('1234')

    expect(await screen.findByRole('alert')).toHaveTextContent('Workstation in use')
    expect(mockPush).not.toHaveBeenCalledWith('/scan/station')
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
