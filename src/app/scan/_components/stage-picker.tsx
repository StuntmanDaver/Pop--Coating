'use client'

const STAGES = [
  { value: 'received', label: 'Received' },
  { value: 'prep', label: 'Prep' },
  { value: 'coating', label: 'Coating' },
  { value: 'curing', label: 'Curing' },
  { value: 'qc', label: 'QC' },
  { value: 'completed', label: 'Completed' },
  { value: 'picked_up', label: 'Picked Up' },
] as const

export type ProductionStage = (typeof STAGES)[number]['value']

interface StagePickerProps {
  currentStage: ProductionStage | string | null
  onSelect: (stage: ProductionStage) => void
  disabled?: boolean
}

export function StagePicker({ currentStage, onSelect, disabled = false }: StagePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" role="group" aria-label="Select production stage">
      {STAGES.map((stage) => {
        const isCurrent = stage.value === currentStage
        return (
          <button
            key={stage.value}
            type="button"
            onClick={() => onSelect(stage.value)}
            disabled={disabled}
            aria-pressed={isCurrent}
            aria-label={`Set stage to ${stage.label}${isCurrent ? ' (current)' : ''}`}
            className={`relative flex min-h-[5rem] items-center justify-center rounded-2xl border px-4 py-4 text-center text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-40 ${
              isCurrent
                ? 'border-white bg-white text-black'
                : 'border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-700'
            }`}
          >
            {isCurrent && (
              <span className="absolute right-2 top-2 text-xs text-zinc-500 font-normal">current</span>
            )}
            {stage.label}
          </button>
        )
      })}
    </div>
  )
}
