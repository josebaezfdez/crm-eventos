import { formatCurrency, formatPercent } from '../../utils/format'
import { assessMargin } from '../../utils/marginCalculator'
import type { ScenarioResult } from '../../types'
import { Badge } from '../ui/Badge'

export function ScenarioTable({ scenarios }: { scenarios: ScenarioResult[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="py-2 pr-3 font-medium">Escenario</th>
            <th className="py-2 pr-3 text-right font-medium">Precio</th>
            <th className="py-2 pr-3 text-right font-medium">Coste</th>
            <th className="py-2 pr-3 text-right font-medium">Beneficio</th>
            <th className="py-2 pr-3 text-right font-medium">Margen</th>
            <th className="py-2 pr-3 font-medium">Recomendación</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s) => {
            const a = assessMargin(s.margin)
            const color = a.level === 'loss' || a.level === 'danger' ? 'red' : a.level === 'warning' ? 'amber' : a.level === 'ok' ? 'green' : 'accent'
            return (
              <tr key={s.key} className="border-b border-slate-50 align-top transition-colors hover:bg-slate-50/50">
                <td className="py-3 pr-3">
                  <p className="font-medium text-slate-900">{s.label}</p>
                  <p className="text-xs text-slate-400">{s.description}</p>
                </td>
                <td className="tnum py-3 pr-3 text-right font-medium text-slate-900">{formatCurrency(s.finalPrice)}</td>
                <td className="tnum py-3 pr-3 text-right text-slate-600">{formatCurrency(s.totalCost)}</td>
                <td className={`tnum py-3 pr-3 text-right font-medium ${s.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(s.profit)}
                </td>
                <td className="py-3 pr-3 text-right">
                  <Badge color={color as 'red' | 'amber' | 'green' | 'accent'}>{formatPercent(s.margin)}</Badge>
                </td>
                <td className="py-3 pr-3 text-xs text-slate-500">{s.recommendation}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
