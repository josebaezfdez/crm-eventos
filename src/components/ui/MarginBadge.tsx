import { assessMargin } from '../../utils/marginCalculator'
import { formatPercent } from '../../utils/format'
import { Badge } from './Badge'
import { TrendingUp, TrendingDown, AlertTriangle, Sparkles } from 'lucide-react'
import type { MarginLevel } from '../../types'

const levelToBadgeColor: Record<MarginLevel, 'red' | 'amber' | 'green' | 'accent'> = {
  loss: 'red',
  danger: 'red',
  warning: 'amber',
  ok: 'green',
  excellent: 'accent',
}

/** Badge compacto de margen (color + texto). */
export function MarginBadge({ margin, showValue = true }: { margin: number; showValue?: boolean }) {
  const a = assessMargin(margin)
  return (
    <Badge color={levelToBadgeColor[a.level]}>
      {showValue ? formatPercent(margin) : a.label}
    </Badge>
  )
}

const alertStyles: Record<MarginLevel, string> = {
  loss: 'border-red-200/70 bg-red-50/80 text-red-800',
  danger: 'border-red-200/70 bg-red-50/80 text-red-800',
  warning: 'border-amber-200/70 bg-amber-50/80 text-amber-800',
  ok: 'border-brand-200/70 bg-brand-50/80 text-brand-800',
  excellent: 'border-accent-200/70 bg-accent-50/80 text-accent-800',
}

const alertIcon: Record<MarginLevel, React.ReactNode> = {
  loss: <TrendingDown size={16} />,
  danger: <AlertTriangle size={16} />,
  warning: <AlertTriangle size={16} />,
  ok: <TrendingUp size={16} />,
  excellent: <Sparkles size={16} />,
}

/** Bloque de alerta con mensaje textual de rentabilidad. */
export function MarginAlert({ margin }: { margin: number }) {
  const a = assessMargin(margin)
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${alertStyles[a.level]}`}>
      <span className="mt-0.5 shrink-0">{alertIcon[a.level]}</span>
      <div>
        <p className="font-semibold">{a.label} · {formatPercent(margin)}</p>
        <p className="mt-0.5 opacity-90">{a.message}</p>
      </div>
    </div>
  )
}

const barColor: Record<MarginLevel, string> = {
  loss: 'bg-red-500',
  danger: 'bg-red-500',
  warning: 'bg-amber-500',
  ok: 'bg-gradient-to-r from-brand-500 to-brand-400',
  excellent: 'bg-gradient-to-r from-accent-500 to-accent-400',
}

/** Barra de progreso visual del margen respecto al objetivo. */
export function MarginBar({ margin, target }: { margin: number; target: number }) {
  const a = assessMargin(margin)
  const width = Math.max(0, Math.min(100, margin))
  return (
    <div className="w-full">
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor[a.level]}`} style={{ width: `${width}%` }} />
        <div
          className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-slate-400"
          style={{ left: `${Math.max(0, Math.min(100, target))}%` }}
          title={`Objetivo ${target}%`}
        />
      </div>
    </div>
  )
}
