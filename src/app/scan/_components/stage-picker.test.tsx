import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

import { StagePicker } from './stage-picker'
import type { ProductionStage } from './stage-picker'

const ALL_STAGES: ProductionStage[] = [
  'received',
  'prep',
  'coating',
  'curing',
  'qc',
  'completed',
  'picked_up',
]

const STAGE_LABELS: Record<ProductionStage, string> = {
  received: 'Received',
  prep: 'Prep',
  coating: 'Coating',
  curing: 'Curing',
  qc: 'QC',
  completed: 'Completed',
  picked_up: 'Picked Up',
}

describe('StagePicker', () => {
  it('renders all 7 stages', () => {
    render(<StagePicker currentStage="coating" onSelect={vi.fn()} />)

    for (const stage of ALL_STAGES) {
      expect(screen.getByText(STAGE_LABELS[stage])).toBeInTheDocument()
    }
  })

  it('current stage button has aria-pressed=true', () => {
    render(<StagePicker currentStage="curing" onSelect={vi.fn()} />)

    const curingButton = screen.getByRole('button', { name: /Set stage to Curing/i })
    expect(curingButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('non-current stage buttons have aria-pressed=false', () => {
    render(<StagePicker currentStage="curing" onSelect={vi.fn()} />)

    for (const stage of ALL_STAGES) {
      if (stage === 'curing') continue
      const btn = screen.getByRole('button', { name: new RegExp(`Set stage to ${STAGE_LABELS[stage]}`, 'i') })
      expect(btn).toHaveAttribute('aria-pressed', 'false')
    }
  })

  it('calls onSelect with the clicked stage value', () => {
    const onSelect = vi.fn()
    render(<StagePicker currentStage="prep" onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('button', { name: /Set stage to Coating/i }))

    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith('coating')
  })

  it('disabled prop disables all stage buttons', () => {
    render(<StagePicker currentStage="prep" onSelect={vi.fn()} disabled />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(7)
    for (const btn of buttons) {
      expect(btn).toBeDisabled()
    }
  })

  it('current stage label includes "(current)" in the aria-label', () => {
    render(<StagePicker currentStage="qc" onSelect={vi.fn()} />)

    const qcButton = screen.getByRole('button', { name: /Set stage to QC \(current\)/i })
    expect(qcButton).toBeInTheDocument()
  })

  it('renders "current" badge text on the active stage', () => {
    render(<StagePicker currentStage="completed" onSelect={vi.fn()} />)

    // The "current" badge span is inside the active button
    const completedButton = screen.getByRole('button', { name: /Set stage to Completed \(current\)/i })
    expect(completedButton).toHaveTextContent('current')
  })

  it('handles null currentStage — no button has aria-pressed=true', () => {
    render(<StagePicker currentStage={null} onSelect={vi.fn()} />)

    const buttons = screen.getAllByRole('button')
    for (const btn of buttons) {
      expect(btn).toHaveAttribute('aria-pressed', 'false')
    }
  })
})
