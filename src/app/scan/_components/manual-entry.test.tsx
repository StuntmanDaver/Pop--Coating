import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

import { ManualEntry } from './manual-entry'

function getInput() {
  return screen.getByRole('textbox')
}

function getSubmitButton() {
  return screen.getByRole('button', { name: /Look Up/i })
}

function getForm() {
  return document.querySelector('form') as HTMLFormElement
}

function getCancelButton() {
  return screen.getByRole('button', { name: /Cancel/i })
}

describe('ManualEntry', () => {
  it('renders the text input', () => {
    render(<ManualEntry onSubmit={vi.fn()} onClose={vi.fn()} />)

    expect(getInput()).toBeInTheDocument()
  })

  it('shows validation error when submitted with fewer than 8 characters', () => {
    render(<ManualEntry onSubmit={vi.fn()} onClose={vi.fn()} />)

    fireEvent.change(getInput(), { target: { value: 'SHORT' } })
    // Submit via form event since the button is disabled when value < 8
    fireEvent.submit(getForm())

    expect(screen.getByRole('alert')).toHaveTextContent('Enter at least 8 characters.')
  })

  it('does not call onSubmit when value is shorter than 8 characters', () => {
    const onSubmit = vi.fn()
    render(<ManualEntry onSubmit={onSubmit} onClose={vi.fn()} />)

    fireEvent.change(getInput(), { target: { value: 'SHORT' } })
    fireEvent.submit(getForm())

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with uppercase normalized value when 8+ characters are entered', () => {
    const onSubmit = vi.fn()
    render(<ManualEntry onSubmit={onSubmit} onClose={vi.fn()} />)

    // Input forces uppercase via handleChange, but we simulate valid length
    fireEvent.change(getInput(), { target: { value: 'abcdefgh' } })
    fireEvent.click(getSubmitButton())

    expect(onSubmit).toHaveBeenCalledWith('ABCDEFGH')
  })

  it('calls onClose when Cancel button is clicked', () => {
    const onClose = vi.fn()
    render(<ManualEntry onSubmit={vi.fn()} onClose={onClose} />)

    fireEvent.click(getCancelButton())

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('enforces max 16 characters — longer input is capped', () => {
    render(<ManualEntry onSubmit={vi.fn()} onClose={vi.fn()} />)

    const longInput = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' // 26 chars
    fireEvent.change(getInput(), { target: { value: longInput } })

    expect(getInput()).toHaveValue('ABCDEFGHIJKLMNOP') // 16 chars
  })

  it('removes non-alphanumeric characters from input', () => {
    render(<ManualEntry onSubmit={vi.fn()} onClose={vi.fn()} />)

    fireEvent.change(getInput(), { target: { value: 'ABC!@# 123' } })

    expect(getInput()).toHaveValue('ABC123')
  })

  it('clears validation error when input changes', () => {
    render(<ManualEntry onSubmit={vi.fn()} onClose={vi.fn()} />)

    fireEvent.change(getInput(), { target: { value: 'SHORT' } })
    fireEvent.submit(getForm())
    expect(screen.getByRole('alert')).toBeInTheDocument()

    fireEvent.change(getInput(), { target: { value: 'TOOLONGVALID' } })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('Submit button is disabled when value is shorter than 8 characters', () => {
    render(<ManualEntry onSubmit={vi.fn()} onClose={vi.fn()} />)

    fireEvent.change(getInput(), { target: { value: 'SHORT' } })

    expect(getSubmitButton()).toBeDisabled()
  })
})
