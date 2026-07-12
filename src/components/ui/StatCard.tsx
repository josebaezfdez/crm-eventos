import { type ReactNode } from 'react'

type Accent = 'brand' | 'accent' | 'green' | 'amber' | 'red' | 'blue' | 'slate'

interface StatCardProps {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
  accent?: Accent
  className?: string
}

const chipClass: Record<Accent, string> = {
  brand: 'icon-chip-brand',
  accent: 'icon-chip-accent',
  green: 'icon-chip bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100',
  amber: 'icon-chip bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100',
  red: 'icon-chip bg-red-50 text-red-600 ring-1 ring-inset ring-red-100',
  blue: 'icon-chip bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100',
  slate: 'icon-chip-slate',
}

export function StatCard({ label, value, hint, icon, accent = 'slate', className = '' }: StatCardProps) {
  return (
    <div className={`card card-hover p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-500">{label}</p>
          <p className="tnum mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        {icon && <div className={chipClass[accent]}>{icon}</div>}
      </div>
    </div>
  )
}
