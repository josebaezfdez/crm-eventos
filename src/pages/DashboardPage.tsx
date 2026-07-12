import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardTitle, CardSubtitle } from '../components/ui/Card'
import { IncomeCostChart } from '../components/ui/IncomeCostChart'
import { MarginBadge } from '../components/ui/MarginBadge'
import { EventStatusBadge } from '../components/ui/StatusBadges'
import { ComingSoon } from '../components/ui/EmptyState'
import { useDashboardMetrics } from '../hooks/useSelectors'
import { formatCurrency, formatPercent, formatDate } from '../utils/format'
import {
  TrendingUp,
  Wallet,
  Percent,
  Clock,
  CalendarCheck,
  FileText,
  CheckCircle2,
  ArrowRight,
  Flame,
  AlertTriangle,
  Receipt,
  FileDown,
  Send,
  Plug,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { QuickStartWizard } from '../components/dashboard/QuickStartWizard'
import { useStore } from '../store/useStore'
import { Button } from '../components/ui/Button'

export default function DashboardPage() {
  const m = useDashboardMetrics()
  const clients = useStore(s => s.clients)
  const events = useStore(s => s.events)
  
  const [wizardOpen, setWizardOpen] = useState(false)

  // Auto-abrir asistente si la cuenta está completamente vacía
  useEffect(() => {
    if (clients.length === 0 && events.length === 0) {
      setWizardOpen(true)
    }
  }, [clients.length, events.length])

  const marginAccent = m.averageMargin >= 35 ? 'text-brand-600' : m.averageMargin >= 20 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Resumen"
        title="Cuadro de mando"
        description="La salud económica de tu negocio de eventos, de un vistazo."
      />

      {/* ============================ BENTO GRID ============================ */}
      <div className="bento">
        {/* HERO — Facturación + beneficio del mes (grande, gradiente) */}
        <Card
          padded={false}
          className="bg-slate-900 text-white shadow-sm border-t-4 border-t-brand-500 sm:col-span-2 lg:col-span-2 lg:row-span-2"
        >
          <div className="flex h-full flex-col justify-between p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-300 uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                Facturación estimada
              </div>
              <Wallet size={16} className="text-slate-400" />
            </div>
            <div className="mt-4">
              <p className="tnum text-3xl font-semibold tracking-tight text-white">
                {formatCurrency(m.estimatedBillingMonth)}
              </p>
              <p className="mt-1 text-[12px] text-slate-400">Eventos aceptados / completados este mes</p>
              <div className="mt-4">
                <Button 
                  onClick={() => setWizardOpen(true)}
                  className="bg-brand-500 hover:bg-brand-400 text-white border-none shadow-[0_0_15px_rgba(var(--brand-500),0.3)] hover:shadow-[0_0_20px_rgba(var(--brand-500),0.5)] transition-all"
                >
                  <Wand2 size={16} className="mr-2" />
                  Asistente nuevo evento
                </Button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-md bg-slate-800/50 p-2.5 ring-1 ring-inset ring-slate-700 border-none">
                <p className="flex items-center gap-1.5 text-[11px] text-slate-400 uppercase tracking-wider">
                  <TrendingUp size={12} /> Beneficio est.
                </p>
                <p className="tnum mt-1 text-base font-medium text-white">{formatCurrency(m.estimatedProfitMonth)}</p>
              </div>
              <div className="rounded-md bg-slate-800/50 p-2.5 ring-1 ring-inset ring-slate-700 border-none">
                <p className="flex items-center gap-1.5 text-[11px] text-slate-400 uppercase tracking-wider">
                  <Percent size={12} /> Margen medio
                </p>
                <p className="tnum mt-1 text-base font-medium text-white">{formatPercent(m.averageMargin, 1)}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Margen medio (ring) */}
        <Card className="flex flex-col justify-between sm:col-span-1 lg:col-span-1 lg:row-span-1" padded={false}>
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">Margen medio</p>
              <Percent size={14} className="text-brand-500" />
            </div>
            <div className="mt-2 flex items-end gap-2">
              <p className={`tnum text-3xl font-semibold tracking-tight ${marginAccent}`}>{formatPercent(m.averageMargin, 0)}</p>
              <span className="mb-1 text-[11px] text-slate-400">sobre aceptados</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                style={{ width: `${Math.max(2, Math.min(100, m.averageMargin))}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Dinero pendiente */}
        <Card className="flex flex-col justify-between sm:col-span-1 lg:col-span-1 lg:row-span-1">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-slate-500">Por cobrar</p>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="mt-3">
            <p className="tnum text-4xl font-bold tracking-tight text-slate-900">{formatCurrency(m.pendingMoney)}</p>
            <p className="mt-2 text-xs text-slate-400">Pagos no cobrados</p>
          </div>
          <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-amber-600">
            <AlertTriangle size={12} /> Revisa los vencimientos
          </div>
        </Card>

        {/* CHART ingresos vs costes (grande) */}
        <Card className="flex flex-col sm:col-span-2 lg:col-span-2 lg:row-span-2">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <CardTitle>Ingresos vs costes</CardTitle>
              <CardSubtitle>Últimos 6 meses · eventos aceptados / completados</CardSubtitle>
            </div>
            <span className="eyebrow">6 meses</span>
          </div>
          <div className="flex flex-1 items-center">
            <IncomeCostChart data={m.monthlySeries} />
          </div>
        </Card>

        {/* PRÓXIMOS eventos (alto) */}
        <Card className="flex flex-col sm:col-span-1 lg:col-span-1 lg:row-span-2">
          <div className="mb-3 flex items-center justify-between">
            <CardTitle>Próximos eventos</CardTitle>
            <Link to="/events" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {m.upcoming.length === 0 ? (
              <p className="text-sm text-slate-400">No hay próximos eventos.</p>
            ) : (
              m.upcoming.map((ev) => (
                <Link
                  key={ev.id}
                  to={`/events/${ev.id}`}
                  className="group flex items-center justify-between rounded-xl border border-slate-100 p-3 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{ev.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{formatDate(ev.date)}</p>
                  </div>
                  <EventStatusBadge status={ev.status} />
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* MENOS rentables */}
        <Card className="flex flex-col sm:col-span-1 lg:col-span-1 lg:row-span-1">
          <div className="mb-3 flex items-center gap-2">
            <Flame size={15} className="text-red-500" />
            <CardTitle>Menos rentables</CardTitle>
          </div>
          {m.leastProfitable.length === 0 ? (
            <p className="text-sm text-slate-400">Sin datos.</p>
          ) : (
            <ul className="space-y-2.5">
              {m.leastProfitable.slice(0, 3).map((r) => (
                <li key={r.eventId}>
                  <Link to={`/events/${r.eventId}`} className="group flex items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-600 group-hover:text-slate-900">{r.name}</span>
                    <span className="tnum shrink-0 text-xs text-slate-400">{formatCurrency(r.offered)}</span>
                    <MarginBadge margin={r.margin} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* MÁS rentables */}
        <Card className="flex flex-col sm:col-span-1 lg:col-span-1 lg:row-span-1">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={15} className="text-accent-500" />
            <CardTitle>Más rentables</CardTitle>
          </div>
          {m.mostProfitable.length === 0 ? (
            <p className="text-sm text-slate-400">Sin datos.</p>
          ) : (
            <ul className="space-y-2.5">
              {m.mostProfitable.slice(0, 3).map((r) => (
                <li key={r.eventId}>
                  <Link to={`/events/${r.eventId}`} className="group flex items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-600 group-hover:text-slate-900">{r.name}</span>
                    <span className="tnum shrink-0 text-xs text-slate-400">{formatCurrency(r.offered)}</span>
                    <MarginBadge margin={r.margin} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* KPIs secundarios en tira (ocupa 2 cols) */}
        <Card className="sm:col-span-2 lg:col-span-2">
          <div className="grid grid-cols-3 divide-x divide-slate-100">
            <KpiCell icon={<CalendarCheck size={16} />} label="Confirmados" value={String(m.confirmedEvents)} accent="blue" />
            <KpiCell icon={<FileText size={16} />} label="Presup. pendientes" value={String(m.pendingBudgets)} accent="slate" />
            <KpiCell icon={<CheckCircle2 size={16} />} label="Presup. aceptados" value={String(m.acceptedBudgets)} accent="green" />
          </div>
        </Card>
      </div>

      {/* ============================ PRÓXIMAMENTE ============================ */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent-500" />
            <CardTitle>Próximamente</CardTitle>
          </div>
          <span className="text-xs text-slate-400">Funciones en preparación</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ComingSoon icon={<Receipt size={14} />} label="Subir ticket o factura" description="lectura automática" />
          <ComingSoon icon={<FileDown size={14} />} label="Exportar a PDF" description="descarga directa" />
          <ComingSoon icon={<Send size={14} />} label="Enviar por email" description="al cliente" />
          <ComingSoon icon={<Plug size={14} />} label="Facturación externa" description="integración futura" />
        </div>
      </Card>

      <QuickStartWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  )
}

function KpiCell({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent: 'brand' | 'accent' | 'green' | 'amber' | 'red' | 'blue' | 'slate'
}) {
  const colors: Record<string, string> = {
    brand: 'text-brand-600',
    accent: 'text-accent-600',
    green: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    slate: 'text-slate-600',
  }
  return (
    <div className="flex flex-col items-center justify-center px-3 py-2 text-center">
      <span className={`mb-1.5 ${colors[accent]}`}>{icon}</span>
      <p className="tnum text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium text-slate-400">{label}</p>
    </div>
  )
}
