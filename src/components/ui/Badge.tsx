type BadgeColor = 'slate' | 'brand' | 'accent' | 'green' | 'amber' | 'red' | 'blue' | 'violet'

interface BadgeProps {
  color?: BadgeColor
  children: React.ReactNode
  className?: string
}

const colorClass: Record<BadgeColor, string> = {
  slate: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200/60',
  brand: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100',
  accent: 'bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-100',
  green: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100',
  red: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-100',
  blue: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100',
  violet: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-100',
}

export function Badge({ color = 'slate', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass[color]} ${className}`}
    >
      {children}
    </span>
  )
}
