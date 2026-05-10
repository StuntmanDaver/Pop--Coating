import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

import { PhotoCapture } from './photo-capture'

let mockBlob: Blob

beforeEach(() => {
  mockBlob = new Blob(['fake'], { type: 'image/jpeg' })

  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
    callback: BlobCallback
  ) {
    callback(mockBlob)
  })

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D)

  // Mock Image: sets src triggers onload asynchronously
  global.Image = class MockImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    width = 800
    height = 600
    private _src = ''

    get src() {
      return this._src
    }

    set src(val: string) {
      this._src = val
      setTimeout(() => this.onload?.(), 0)
    }
  } as unknown as typeof Image

  URL.createObjectURL = vi.fn(() => 'blob:test-preview')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PhotoCapture', () => {
  it('renders the "Add Photo" button when no photo is captured', () => {
    render(<PhotoCapture onCapture={vi.fn()} onClear={vi.fn()} capturedBlob={null} />)

    expect(screen.getByRole('button', { name: /Add Photo/i })).toBeInTheDocument()
  })

  it('shows preview image and "Remove Photo" button after capture', async () => {
    const onCapture = vi.fn()
    const { rerender } = render(
      <PhotoCapture onCapture={onCapture} onClear={vi.fn()} capturedBlob={null} />
    )

    // Simulate file input change
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } })
      // Let the async Image onload fire
      await new Promise((r) => setTimeout(r, 10))
    })

    // After capture fires, rerender with the blob set (simulating parent state update)
    rerender(
      <PhotoCapture onCapture={onCapture} onClear={vi.fn()} capturedBlob={mockBlob} />
    )

    expect(screen.getByAltText('Captured photo preview')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Remove Photo/i })).toBeInTheDocument()
  })

  it('calls onCapture with a Blob after file selection', async () => {
    const onCapture = vi.fn()
    render(<PhotoCapture onCapture={onCapture} onClear={vi.fn()} capturedBlob={null} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } })
      await new Promise((r) => setTimeout(r, 10))
    })

    expect(onCapture).toHaveBeenCalledOnce()
    expect(onCapture).toHaveBeenCalledWith(expect.any(Blob))
  })

  it('calls onClear when "Remove Photo" is clicked', async () => {
    const onClear = vi.fn()
    const onCapture = vi.fn()
    const { rerender } = render(
      <PhotoCapture onCapture={onCapture} onClear={onClear} capturedBlob={null} />
    )

    // Trigger capture first so internal previewUrl is set
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } })
      await new Promise((r) => setTimeout(r, 10))
    })

    // Rerender with capturedBlob so the preview UI is shown
    rerender(
      <PhotoCapture onCapture={onCapture} onClear={onClear} capturedBlob={mockBlob} />
    )

    fireEvent.click(screen.getByRole('button', { name: /Remove Photo/i }))

    expect(onClear).toHaveBeenCalledOnce()
  })

  it('clicking "Add Photo" button triggers the hidden file input', () => {
    render(<PhotoCapture onCapture={vi.fn()} onClear={vi.fn()} capturedBlob={null} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click')

    fireEvent.click(screen.getByRole('button', { name: /Add Photo/i }))

    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it('shows error message when compression fails', async () => {
    // Override canvas toBlob to simulate failure
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
      callback: BlobCallback
    ) {
      callback(null)
    })

    render(<PhotoCapture onCapture={vi.fn()} onClear={vi.fn()} capturedBlob={null} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } })
      await new Promise((r) => setTimeout(r, 10))
    })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})
