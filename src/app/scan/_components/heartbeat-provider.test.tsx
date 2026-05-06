import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import '@testing-library/jest-dom'

// Use vi.hoisted to declare mocks that are referenced inside vi.mock factories
const { mockReplace, mockRecordWorkstationHeartbeat } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockRecordWorkstationHeartbeat: vi.fn(),
}))

vi.mock('@/modules/scanning', () => ({
  recordWorkstationHeartbeat: mockRecordWorkstationHeartbeat,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}))

import { HeartbeatProvider } from './heartbeat-provider'

const HEARTBEAT_INTERVAL_MS = 30_000

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  mockRecordWorkstationHeartbeat.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('HeartbeatProvider', () => {
  it('renders children', () => {
    render(
      <HeartbeatProvider>
        <span data-testid="child">Hello</span>
      </HeartbeatProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('does not call recordWorkstationHeartbeat immediately on mount', () => {
    render(<HeartbeatProvider><div /></HeartbeatProvider>)

    expect(mockRecordWorkstationHeartbeat).not.toHaveBeenCalled()
  })

  it('calls recordWorkstationHeartbeat after one interval', async () => {
    render(<HeartbeatProvider><div /></HeartbeatProvider>)

    await act(async () => {
      vi.advanceTimersByTime(HEARTBEAT_INTERVAL_MS)
    })

    expect(mockRecordWorkstationHeartbeat).toHaveBeenCalledOnce()
  })

  it('calls recordWorkstationHeartbeat multiple times across intervals', async () => {
    render(<HeartbeatProvider><div /></HeartbeatProvider>)

    await act(async () => {
      vi.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 3)
    })

    expect(mockRecordWorkstationHeartbeat).toHaveBeenCalledTimes(3)
  })

  it('calls router.replace("/scan") when heartbeat rejects (auth failure)', async () => {
    mockRecordWorkstationHeartbeat.mockRejectedValue(new Error('403 Forbidden'))

    render(<HeartbeatProvider><div /></HeartbeatProvider>)

    await act(async () => {
      vi.advanceTimersByTime(HEARTBEAT_INTERVAL_MS)
      // Flush promise queue so the .catch handler runs
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(mockReplace).toHaveBeenCalledWith('/scan')
  })

  it('does not redirect when heartbeat succeeds', async () => {
    mockRecordWorkstationHeartbeat.mockResolvedValue(undefined)

    render(<HeartbeatProvider><div /></HeartbeatProvider>)

    await act(async () => {
      vi.advanceTimersByTime(HEARTBEAT_INTERVAL_MS)
      await Promise.resolve()
    })

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('clears the interval on unmount', async () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')

    const { unmount } = render(<HeartbeatProvider><div /></HeartbeatProvider>)

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
  })
})
