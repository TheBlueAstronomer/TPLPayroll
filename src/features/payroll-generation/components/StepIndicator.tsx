import { Check } from '@phosphor-icons/react/dist/ssr'

interface Step {
  label: string
}

interface Props {
  steps: Step[]
  currentStep: number // 0-indexed
}

export function StepIndicator({ steps, currentStep }: Props) {
  return (
    <div className="flex items-center">
      {steps.map((step, index) => {
        const isDone = index < currentStep
        const isCurrent = index === currentStep
        const isUpcoming = index > currentStep
        const isLast = index === steps.length - 1

        return (
          <div key={step.label} className="flex items-center">
            {/* ── Step node ──────────────────────────────────────────── */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-mono font-medium transition-colors duration-300 ease-out',
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                      ? 'border-2 border-emerald-600 bg-white text-emerald-600'
                      : 'border border-zinc-300 bg-white text-zinc-400',
                ].join(' ')}
              >
                {isDone ? <Check size={14} weight="bold" className="check-pop" /> : index + 1}
              </div>
              <span
                className={`whitespace-nowrap text-xs ${
                  isCurrent ? 'font-medium text-zinc-700' : isUpcoming ? 'text-zinc-400' : 'text-emerald-600'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* ── Connector ──────────────────────────────────────────── */}
            {!isLast && (
              <div className="mb-5 h-[2px] w-12 overflow-hidden rounded-full bg-zinc-200 sm:w-16 md:w-20">
                <div
                  className="h-full w-full origin-left bg-emerald-600 transition-transform duration-300 ease-[var(--ease-out)] motion-reduce:transition-none"
                  style={{ transform: isDone ? 'scaleX(1)' : 'scaleX(0)' }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
