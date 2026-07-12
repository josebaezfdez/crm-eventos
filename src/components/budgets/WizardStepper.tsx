import { Check } from 'lucide-react'

interface Step {
  title: string
  description: string
}

interface WizardStepperProps {
  steps: Step[]
  current: number
  onStepClick?: (index: number) => void
  maxReached: number
}

export function WizardStepper({ steps, current, onStepClick, maxReached }: WizardStepperProps) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200/70 bg-white p-2 shadow-card">
      {steps.map((step, i) => {
        const isDone = i < current
        const isActive = i === current
        const isReachable = i <= maxReached && !!onStepClick
        return (
          <div key={step.title} className="flex items-center">
            <button
              type="button"
              disabled={!isReachable}
              onClick={() => isReachable && onStepClick?.(i)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-glow'
                  : isDone
                    ? 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100'
                    : 'text-slate-400 hover:bg-slate-50'
              } ${isReachable && !isActive ? 'hover:bg-slate-100' : ''}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isDone
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isDone ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              <span className="hidden font-medium sm:inline">{step.title}</span>
            </button>
            {i < steps.length - 1 && (
              <span className={`mx-1 h-px w-4 sm:w-6 ${isDone ? 'bg-brand-300' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </nav>
  )
}
