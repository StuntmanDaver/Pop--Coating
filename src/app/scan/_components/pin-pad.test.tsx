import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

import { PinPad } from './pin-pad'

function getKey(label: string) {
  return screen.getByRole('button', { name: label })
}

describe('PinPad', () => {
  it('renders 12 keys: digits 0-9, CLR, and Backspace', () => {
    render(<PinPad onSubmit={vi.fn()} />)

    for (const digit of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']) {
      expect(screen.getByRole('button', { name: digit })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Backspace' })).toBeInTheDocument()
  })

  it('calls onSubmit with the 4-digit PIN after 4 digits are entered', () => {
    const onSubmit = vi.fn()
    render(<PinPad onSubmit={onSubmit} />)

    fireEvent.click(getKey('1'))
    fireEvent.click(getKey('2'))
    fireEvent.click(getKey('3'))
    expect(onSubmit).not.toHaveBeenCalled()
    fireEvent.click(getKey('4'))

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit).toHaveBeenCalledWith('1234')
  })

  it('CLR button clears the entered PIN', () => {
    const onSubmit = vi.fn()
    render(<PinPad onSubmit={onSubmit} />)

    fireEvent.click(getKey('1'))
    fireEvent.click(getKey('2'))
    fireEvent.click(getKey('Clear'))
    // After CLR, entering 4 more digits should submit '5678' not '1256...'
    fireEvent.click(getKey('5'))
    fireEvent.click(getKey('6'))
    fireEvent.click(getKey('7'))
    fireEvent.click(getKey('8'))

    expect(onSubmit).toHaveBeenCalledWith('5678')
  })

  it('Backspace removes the last digit', () => {
    const onSubmit = vi.fn()
    render(<PinPad onSubmit={onSubmit} />)

    fireEvent.click(getKey('1'))
    fireEvent.click(getKey('2'))
    fireEvent.click(getKey('3'))
    fireEvent.click(getKey('Backspace'))
    // PIN is now '12'; entering 2 more should give '1245'
    fireEvent.click(getKey('4'))
    fireEvent.click(getKey('5'))

    expect(onSubmit).toHaveBeenCalledWith('1245')
  })

  it('disabled prop disables all buttons', () => {
    render(<PinPad onSubmit={vi.fn()} disabled />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(12)
    for (const btn of buttons) {
      expect(btn).toBeDisabled()
    }
  })

  it('renders error message when error prop is provided', () => {
    render(<PinPad onSubmit={vi.fn()} error="Incorrect PIN" />)

    expect(screen.getByRole('alert')).toHaveTextContent('Incorrect PIN')
  })

  it('does not render error element when error prop is null', () => {
    render(<PinPad onSubmit={vi.fn()} error={null} />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
