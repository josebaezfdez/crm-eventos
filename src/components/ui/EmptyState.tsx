import { type ReactNode } from 'react'
import { Sparkles, ArrowUpRight } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

interface ComingSoonProps {
  label: string
  description?: string
  icon?: ReactNode
}

/** Etiqueta "Próximamente" para funciones aún no implementadas. */
export function ComingSoon({ label, description, icon }: ComingSoonProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-500">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 ring-1 ring-inset ring-slate-200">
        {icon ?? <Sparkles size={14} />}
      </span>
      <span className="min-w-0">
        <span className="font-medium text-slate-600">{label}</span>
        {description && <span className="text-slate-400"> · {description}</span>}
      </span>
      <ArrowUpRight size={13} className="ml-auto shrink-0 text-slate-300" />
    </div>
  )
}
