import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardTitle, CardSubtitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, TextArea } from '../components/ui/Input'
import { EmptyState, ComingSoon } from '../components/ui/EmptyState'
import { Badge } from '../components/ui/Badge'
import { useEvent, useBudget, usePostEventResult } from '../hooks/useSelectors'
import { useStore } from '../store/useStore'
import { formatCurrency, formatPercent } from '../utils/format'
import { assessMargin, priceIncreaseToReachTarget, vatFromTotal } from '../utils/marginCalculator'
import type { BudgetItemCategory, RealCostLine } from '../types'
import {
  ArrowLeft, Receipt, TrendingUp, TrendingDown, BarChart3, Sparkles,
  CheckCircle2, AlertTriangle, AlertCircle, Save,
} from 'lucide-react'

export default function PostEventPage() {
  const { id } = useParams()
  const event = useEvent(id)
  const budget = useBudget(event?.acceptedBudgetId ?? undefined)
  const existing = usePostEventResult(id)
  const upsert = useStore((s) => s.upsertPostEventResult)

  const budgetedByCategory = useMemo(() => {
    const map = new Map<BudgetItemCategory, number>()
    budget?.items.forEach((it) => map.set(it.category, (map.get(it.category) ?? 0) + it.totalCost))
    return map
  }, [budget])

  const [realLines, setRealLines] = useState<RealCostLine[]>(
    existing
      ? existing.realCostLines
      : Array.from(budgetedByCategory.entries()).map(([category, budgeted]) => ({ category, budgeted, real: budgeted })),
  )
  const [charged, setCharged] = useState<number>(existing?.chargedPrice ?? budget?.offeredPriceWithVAT ?? 0)
  const [notes, setNotes] = useState<string>(existing?.notes ?? '')
  const [saved, setSaved] = useState<boolean>(!!existing)

  if (!event || !budget) {
    return (
      <EmptyState
        title="Faltan datos para el resultado post-evento"
        description="Necesitas un evento con presupuesto para comparar previsto vs real."
        icon={<AlertCircle size={22} />}
        action={<Link to="/events"><Button variant="secondary" size="sm">Volver a eventos</Button></Link>}
      />
    )
  }

  const vat = budget.vatPercentage
  const realTotal = realLines.reduce((acc, l) => acc + l.real, 0)
  const chargedWithoutVAT = vatFromTotal(charged, vat)
  const realProfit = chargedWithoutVAT - realTotal
  const realMargin = chargedWithoutVAT === 0 ? 0 : (realProfit / chargedWithoutVAT) * 100

  const budgetedMargin = budget.expectedMarginPercentage
  const marginDeviation = realMargin - budgetedMargin

  const updateReal = (idx: number, value: number) => {
    setRealLines((prev) => prev.map((l, i) => (i === idx ? { ...l, real: value } : l)))
    setSaved(false)
  }

  const save = () => {
    upsert(event.id, { chargedPrice: charged, realCostLines: realLines, notes })
    setSaved(true)
  }

  const lostCategories = realLines
    .map((l) => ({ ...l, deviation: l.real - l.budgeted }))
    .filter((l) => l.deviation > 0)
    .sort((a, b) => b.deviation - a.deviation)

  const increaseNeeded = priceIncreaseToReachTarget(charged, realTotal, budget.targetMarginPercentage, vat)

  const messages: { tone: 'good' | 'warn' | 'bad'; text: string }[] = []
  if (realMargin >= budget.targetMarginPercentage) {
    messages.push({ tone: 'good', text: 'El evento fue rentable y alcanzó el margen objetivo.' })
  } else if (realMargin >= 20) {
    messages.push({ tone: 'warn', text: 'El evento fue rentable, pero el margen real quedó por debajo del objetivo.' })
  } else if (realMargin >= 0) {
    messages.push({ tone: 'warn', text: 'El margen real quedó muy ajustado. Cuidado con eventos similares.' })
  } else {
    messages.push({ tone: 'bad', text: 'El evento salió con pérdidas. Revisa el precio y el control de costes.' })
  }

  if (lostCategories.length > 0) {
    const top = lostCategories[0]
    messages.push({ tone: 'warn', text: `El coste de ${top.category.toLowerCase()} superó lo previsto en ${formatCurrency(top.deviation)}.` })
  }

  if (increaseNeeded > 0) {
    messages.push({ tone: 'warn', text: `Para un evento similar, el precio recomendado debería subir un ${formatPercent(increaseNeeded, 0)} para alcanzar el margen objetivo.` })
  } else {
    messages.push({ tone: 'good', text: 'Con el precio actual ya alcanzas el margen objetivo. Bien hecho.' })
  }

  const toneStyle = {
    good: 'border-emerald-200/70 bg-emerald-50/80 text-emerald-800',
    warn: 'border-amber-200/70 bg-amber-50/80 text-amber-800',
    bad: 'border-red-200/70 bg-red-50/80 text-red-800',
  }
  const toneIcon = { good: <CheckCircle2 size={15} />, warn: <AlertTriangle size={15} />, bad: <AlertCircle size={15} /> }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Análisis"
        title={`Resultado post-evento · ${event.name}`}
        description="Compara lo previsto contra lo real y aprende para el próximo evento."
        actions={<Link to={`/events/${event.id}`}><Button variant="secondary" size="sm"><ArrowLeft size={15} /> Volver al evento</Button></Link>}
      />

      {/* Comparativa principal */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CompareCard icon={<Receipt size={16} />} label="Coste presupuestado" value={formatCurrency(budget.totalCost)} />
        <CompareCard icon={<Receipt size={16} />} label="Coste real" value={formatCurrency(realTotal)} accent={realTotal > budget.totalCost ? 'red' : 'green'} />
        <CompareCard icon={<TrendingUp size={16} />} label="Precio cobrado" value={formatCurrency(charged)} sub="con IVA" />
        <CompareCard icon={<BarChart3 size={16} />} label="Margen real" value={formatPercent(realMargin)} accent={realMargin >= 35 ? 'green' : realMargin >= 20 ? 'amber' : 'red'} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Desviación por categoría */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2"><BarChart3 size={16} className="text-brand-500" /><CardTitle>Desviación por categoría</CardTitle></div>
          <CardSubtitle className="mb-4 mt-1">Ajusta el coste real de cada bloque.</CardSubtitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-2 pr-3 font-semibold">Categoría</th>
                  <th className="py-2 pr-3 text-right font-semibold">Presupuestado</th>
                  <th className="py-2 pr-3 text-right font-semibold">Real</th>
                  <th className="py-2 pr-3 text-right font-semibold">Desviación</th>
                </tr>
              </thead>
              <tbody>
                {realLines.map((l, idx) => {
                  const dev = l.real - l.budgeted
                  return (
                    <tr key={l.category} className="border-b border-slate-50">
                      <td className="py-2.5 pr-3 font-medium text-slate-700">{l.category}</td>
                      <td className="tnum py-2.5 pr-3 text-right text-slate-600">{formatCurrency(l.budgeted)}</td>
                      <td className="py-2.5 pr-3 text-right">
                        <input
                          type="number" min={0} step="0.01" value={l.real}
                          onChange={(e) => updateReal(idx, Number(e.target.value))}
                          className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-right text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                        />
                      </td>
                      <td className={`tnum py-2.5 pr-3 text-right font-semibold ${dev > 0 ? 'text-red-600' : dev < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {dev > 0 ? '+' : ''}{formatCurrency(dev)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Precio cobrado real (con IVA)" type="number" min={0} value={charged} onChange={(e) => { setCharged(Number(e.target.value)); setSaved(false) }} />
            <div className="flex items-end">
              <div className="w-full rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 text-sm">
                <p className="flex items-center gap-1.5 text-slate-500"><Target2 /> Margen previsto</p>
                <p className="tnum font-semibold text-slate-900">{formatPercent(budgetedMargin)}</p>
                <p className="mt-1.5 flex items-center gap-1.5 text-slate-500">Desviación de margen</p>
                <p className={`tnum flex items-center gap-1 font-semibold ${marginDeviation >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {marginDeviation >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {marginDeviation >= 0 ? '+' : ''}{formatPercent(marginDeviation)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <TextArea label="Notas del resultado" value={notes} onChange={(e) => { setNotes(e.target.value); setSaved(false) }} />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <ComingSoon icon={<Receipt size={14} />} label="Subir tickets reales" description="lectura automática" />
            <Button onClick={save}><Save size={15} /> {saved ? 'Guardar cambios' : 'Guardar resultado'}</Button>
          </div>
          {saved && <p className="mt-2 text-right text-xs text-emerald-600">Resultado guardado.</p>}
        </Card>

        {/* Diagnóstico */}
        <Card>
          <div className="mb-3 flex items-center gap-2"><Sparkles size={16} className="text-accent-500" /><CardTitle>Diagnóstico</CardTitle></div>
          <CardSubtitle className="mb-4">Lectura rápida del evento.</CardSubtitle>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">Margen real</span>
            <Badge color={assessMargin(realMargin).level === 'loss' || assessMargin(realMargin).level === 'danger' ? 'red' : assessMargin(realMargin).level === 'warning' ? 'amber' : 'green'}>
              {formatPercent(realMargin)}
            </Badge>
          </div>
          <ul className="space-y-2.5">
            {messages.map((m, i) => (
              <li key={i} className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm ${toneStyle[m.tone]}`}>
                <span className="mt-0.5 shrink-0">{toneIcon[m.tone]}</span>
                <span>{m.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}

function CompareCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent?: 'green' | 'amber' | 'red' }) {
  const color = accent === 'green' ? 'text-emerald-600' : accent === 'amber' ? 'text-amber-600' : accent === 'red' ? 'text-red-600' : 'text-slate-900'
  return (
    <Card>
      <div className="flex items-center gap-2 text-slate-400">{icon}<p className="text-xs font-medium text-slate-500">{label}</p></div>
      <p className={`tnum mt-2 text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
    </Card>
  )
}

function Target2() {
  return <BarChart3 size={13} />
}
