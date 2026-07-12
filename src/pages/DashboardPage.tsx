import { Link } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardTitle, CardSubtitle } from '../components/ui/Card'
import { IncomeCostChart } from '../components/ui/IncomeCostChart'
import { MarginBadge } from '../components/ui/MarginBadge'
import { EventStatusBadge } from '../components/ui/StatusBadges'
import { useDashboardMetrics } from '../hooks/useSelectors'
import { formatCurrency, formatPercent, formatDate } from '../utils/format'
import {
  Wallet,
  TrendingUp,
  Percent,
  Clock,
  CalendarCheck,
  Plus,
  Flame,
  AlertTriangle,
  FileText
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { Button } from '../components/ui/Button'

export default function DashboardPage() {
  const m = useDashboardMetrics()
  const budgets = useStore(s => s.budgets)
  const events = useStore(s => s.events)
  const payments = useStore(s => s.payments)
  const clients = useStore(s => s.clients)

  const pendingBudgetsData = budgets
    .filter(b => b.status === 'sent')
    .slice(0, 5)
    .map(b => ({
      ...b,
      event: events.find(e => e.id === b.eventId),
      client: clients.find(c => c.id === b.clientId)
    }))

  const pendingPayments = payments
    .filter(p => p.status === 'pending')
    .slice(0, 5)
    .map(p => ({
      ...p,
      event: events.find(e => e.id === p.eventId)
    }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel de control"
        description="Resumen operativo y financiero de tu negocio."
        actions={
          <Link to="/budgets/new">
            <Button className="bg-brand-600 hover:bg-brand-700 text-white shadow-sm">
              <Plus size={16} className="mr-2" />
              Nuevo presupuesto
            </Button>
          </Link>
        }
      />

      {/* KPI Stripe */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon={<Wallet size={16} />} label="Facturación prevista" value={formatCurrency(m.estimatedBillingMonth)} />
        <KpiCard icon={<TrendingUp size={16} />} label="Beneficio previsto" value={formatCurrency(m.estimatedProfitMonth)} />
        <KpiCard icon={<Percent size={16} />} label="Margen medio" value={formatPercent(m.averageMargin, 1)} />
        <KpiCard icon={<Clock size={16} />} label="Pendiente de cobro" value={formatCurrency(m.pendingMoney)} className="border-amber-200 bg-amber-50" iconColor="text-amber-500" />
        <KpiCard icon={<CalendarCheck size={16} />} label="Eventos confirmados" value={String(m.confirmedEvents)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingresos frente a costes */}
        <Card className="lg:col-span-2 flex flex-col">
          <div className="mb-4">
            <CardTitle>Evolución económica</CardTitle>
            <CardSubtitle>Ingresos frente a costes en los últimos 6 meses</CardSubtitle>
          </div>
          <div className="flex-1 flex items-center min-h-[300px]">
             {m.monthlySeries.length === 0 || m.monthlySeries.every(s => s.income === 0 && s.cost === 0) ? (
              <div className="w-full flex flex-col items-center justify-center text-slate-400 py-12">
                <TrendingUp size={32} className="mb-2 opacity-50" />
                <p className="text-sm">Aún no hay suficientes eventos para calcular la evolución.</p>
              </div>
            ) : (
              <IncomeCostChart data={m.monthlySeries} />
            )}
          </div>
        </Card>

        {/* Próximos eventos (Lista) */}
        <Card className="flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <CardTitle>Próximos eventos</CardTitle>
            <Link to="/events" className="text-xs font-medium text-brand-600 hover:text-brand-700">Ver todos</Link>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {m.upcoming.length === 0 ? (
              <p className="text-sm text-slate-400">No hay próximos eventos planificados.</p>
            ) : (
              m.upcoming.map(ev => (
                <div key={ev.id} className="flex justify-between p-3 border border-slate-200 rounded-md hover:bg-slate-50">
                  <div className="min-w-0">
                    <Link to={`/events/${ev.id}`} className="text-sm font-semibold text-slate-900 hover:text-brand-600 block truncate">{ev.name}</Link>
                    <p className="text-xs text-slate-500">{formatDate(ev.date)}</p>
                  </div>
                  <div className="shrink-0 flex items-center">
                     <EventStatusBadge status={ev.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Presupuestos pendientes */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <FileText size={16} className="text-slate-500" />
            <CardTitle>Presupuestos pendientes</CardTitle>
          </div>
          {pendingBudgetsData.length === 0 ? (
            <p className="text-sm text-slate-400">No hay presupuestos pendientes.</p>
          ) : (
            <div className="space-y-3">
              {pendingBudgetsData.map(b => (
                <div key={b.id} className="flex flex-col border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <Link to={`/budgets/${b.id}`} className="text-sm font-medium text-slate-900 hover:underline">{b.event?.name || 'Presupuesto'}</Link>
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(b.offeredPriceWithVAT)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{b.client?.name}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Menos rentables */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Flame size={16} className="text-red-500" />
            <CardTitle>Atención al margen</CardTitle>
          </div>
          {m.leastProfitable.length === 0 ? (
             <p className="text-sm text-slate-400">Sin datos de margen bajo.</p>
          ) : (
             <div className="space-y-3">
               {m.leastProfitable.slice(0, 5).map((r) => (
                 <div key={r.eventId} className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <Link to={`/events/${r.eventId}`} className="text-sm font-medium text-slate-900 hover:underline truncate mr-2">{r.name}</Link>
                    <MarginBadge margin={r.margin} />
                 </div>
               ))}
             </div>
          )}
        </Card>

        {/* Pagos próximos */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <CardTitle>Pagos próximos a vencer</CardTitle>
          </div>
          {pendingPayments.length === 0 ? (
             <p className="text-sm text-slate-400">Al día.</p>
          ) : (
             <div className="space-y-3">
               {pendingPayments.map(p => (
                 <div key={p.id} className="flex justify-between items-start border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                   <div className="min-w-0">
                     <p className="text-sm font-medium text-slate-900 truncate">{p.concept}</p>
                     <p className="text-xs text-slate-500">{p.event?.name}</p>
                   </div>
                   <div className="text-right shrink-0">
                     <p className="text-sm font-semibold text-amber-600">{formatCurrency(p.amount)}</p>
                     <p className="text-xs text-slate-500">{formatDate(p.dueDate)}</p>
                   </div>
                 </div>
               ))}
             </div>
          )}
        </Card>

      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, className = '', iconColor = 'text-brand-600' }: { icon: React.ReactNode, label: string, value: string, className?: string, iconColor?: string }) {
  return (
    <Card className={`p-4 flex flex-col justify-between ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-md bg-white shadow-sm border border-slate-100 ${iconColor}`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
    </Card>
  )
}
