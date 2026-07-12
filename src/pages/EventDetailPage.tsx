import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardTitle, CardSubtitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { MarginBadge, MarginAlert, MarginBar } from '../components/ui/MarginBadge'
import { EventStatusBadge, PaymentStatusBadge } from '../components/ui/StatusBadges'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState, ComingSoon } from '../components/ui/EmptyState'
import { useClient, useEvent, useBudget, usePaymentsForEvent, usePostEventResult } from '../hooks/useSelectors'
import { useStore } from '../store/useStore'
import { formatCurrency, formatPercent, formatDate, formatDateLong } from '../utils/format'
import { assessMargin } from '../utils/marginCalculator'
import type { EventStatus } from '../types'
import {
  ArrowLeft, Trash2, Calculator, MapPin, Users, Clock, Edit3,
  Building2, TrendingUp, Wallet, Target, Receipt, AlertCircle, BarChart3,
} from 'lucide-react'
import { EventFormModal } from '../components/events/EventFormModal'

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const event = useEvent(id)
  const client = useClient(event?.clientId)
  const budgets = useStore((s) => s.budgets.filter((b) => b.eventId === event?.id))
  const acceptedBudget = useBudget(event?.acceptedBudgetId ?? undefined)
  const budget = acceptedBudget || budgets[budgets.length - 1] // Mostrar resumen del aceptado o del último
  const payments = usePaymentsForEvent(id)
  const postResult = usePostEventResult(id)

  const setEventStatus = useStore((s) => s.setEventStatus)
  const deleteEvent = useStore((s) => s.deleteEvent)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)

  if (!event) {
    return (
      <EmptyState
        title="Evento no encontrado"
        description="Es posible que se haya eliminado."
        icon={<AlertCircle size={22} />}
        action={<Link to="/events"><Button variant="secondary" size="sm">Volver a eventos</Button></Link>}
      />
    )
  }

  const margin = budget?.expectedMarginPercentage ?? 0
  const assessment = assessMargin(margin)
  const pendingPayments = payments.filter((p) => p.status === 'pending').reduce((a, p) => a + p.amount, 0)
  const paidPayments = payments.filter((p) => p.status === 'paid').reduce((a, p) => a + p.amount, 0)

  const statusOptions: { value: EventStatus; label: string }[] = [
    { value: 'draft', label: 'Borrador' },
    { value: 'quoted', label: 'Presupuestado' },
    { value: 'accepted', label: 'Aceptado' },
    { value: 'rejected', label: 'Rechazado' },
    { value: 'completed', label: 'Completado' },
  ]

  const realProfit = postResult ? postResult.chargedPrice / 1.21 - postResult.realTotalCost : 0
  const realMarginPct = postResult ? (realProfit / (postResult.chargedPrice / 1.21)) * 100 : 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={event.type}
        title={event.name}
        description={formatDateLong(event.date)}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/events"><Button variant="secondary" size="sm"><ArrowLeft size={15} /> Eventos</Button></Link>
            <Link to={`/budgets/new?eventId=${event.id}`}><Button size="sm"><Calculator size={15} /> Crear presupuesto</Button></Link>
            <Button variant="secondary" size="sm" onClick={() => setEditModalOpen(true)}><Edit3 size={15} /> Editar</Button>
            <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}><Trash2 size={15} /> Eliminar</Button>
          </div>
        }
      />

      {/* Resumen de rentabilidad */}
      {budget && (
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Resumen económico ({acceptedBudget ? 'Presupuesto Aceptado' : 'Último Presupuesto'})</CardTitle>
              <CardSubtitle>Lo que de verdad importa: ¿ganas o pierdes dinero?</CardSubtitle>
            </div>
            <MarginBadge margin={margin} />
          </div>
          <div className="mt-4">
            <MarginAlert margin={margin} />
          </div>
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><Target size={13} /> Margen vs objetivo ({budget.targetMarginPercentage}%)</span>
              <span className="font-semibold text-slate-700">{formatPercent(margin)}</span>
            </div>
            <MarginBar margin={margin} target={budget.targetMarginPercentage} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric icon={<Wallet size={15} />} label="Precio ofertado" value={formatCurrency(budget.offeredPriceWithVAT)} sub="con IVA" />
            <Metric icon={<Receipt size={15} />} label="Coste total" value={formatCurrency(budget.totalCost)} sub="estimado" />
            <Metric icon={<TrendingUp size={15} />} label="Beneficio esperado" value={formatCurrency(budget.expectedProfit)} accent={budget.expectedProfit >= 0 ? 'green' : 'red'} />
            <Metric icon={<Target size={15} />} label="Mínimo recomendado" value={formatCurrency(budget.recommendedPriceWithVAT)} sub="con IVA" />
          </div>
          {(assessment.level === 'danger' || assessment.level === 'loss') && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 ring-1 ring-inset ring-amber-100">
              Para alcanzar el margen objetivo del {budget.targetMarginPercentage}%, deberías cobrar al menos{' '}
              <strong className="tnum">{formatCurrency(budget.recommendedPriceWithVAT)}</strong>.
            </p>
          )}
        </Card>
      )}

      {/* Lista de presupuestos */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <CardTitle>Historial de Presupuestos</CardTitle>
          <Link to={`/budgets/new?eventId=${event.id}`}>
            <Button size="sm"><Calculator size={14} /> Nuevo presupuesto</Button>
          </Link>
        </div>
        {budgets.length === 0 ? (
           <p className="text-sm text-slate-400">Este evento no tiene presupuestos. Crea uno para empezar a cotizar.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {budgets.map((b, idx) => (
              <li key={b.id} className="flex items-center justify-between py-2.5">
                <div>
                  <Link to={`/budgets/${b.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                    Versión #{idx + 1} {event.acceptedBudgetId === b.id && '(Aceptado)'}
                  </Link>
                  <p className="text-xs text-slate-400">Total: {formatCurrency(b.offeredPriceWithVAT)} · Margen: {formatPercent(b.expectedMarginPercentage)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{b.status}</span>
                  {event.acceptedBudgetId !== b.id && (
                     <Button variant="secondary" size="sm" onClick={() => {
                        useStore.getState().updateEvent(event.id, { acceptedBudgetId: b.id, status: 'accepted' })
                        useStore.getState().updateBudget(b.id, { status: 'accepted' })
                     }}>Aceptar</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Datos del evento */}
        <Card>
          <CardTitle>Datos del evento</CardTitle>
          <dl className="mt-3 space-y-2.5 text-sm">
            <Row icon={<Users size={14} />} label="Cliente" value={client?.name ?? '—'} />
            <Row icon={<Building2 size={14} />} label="Empresa" value={client?.company || '—'} />
            <Row icon={<MapPin size={14} />} label="Ubicación" value={event.location || '—'} />
            <Row icon={<Users size={14} />} label="Asistentes" value={String(event.attendees)} />
            <Row icon={<Clock size={14} />} label="Duración" value={`${event.durationHours} h`} />
            <Row icon={null} label="Estado" value={<EventStatusBadge status={event.status} />} />
          </dl>
          <div className="mt-4">
            <label className="label-base">Cambiar estado</label>
            <div className="flex flex-wrap gap-1.5">
              {statusOptions.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setEventStatus(event.id, o.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    event.status === o.value
                      ? 'bg-brand-600 text-white shadow-glow'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Pagos */}
        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <CardTitle>Pagos</CardTitle>
              <CardSubtitle>
                Cobrado <span className="tnum font-medium text-emerald-600">{formatCurrency(paidPayments)}</span>
                {' · '}Pendiente <span className="tnum font-medium text-amber-600">{formatCurrency(pendingPayments)}</span>
              </CardSubtitle>
            </div>
            <ComingSoon icon={<Receipt size={14} />} label="Pago automático" description="futuro" />
          </div>
          {payments.length === 0 ? (
            <p className="text-sm text-slate-400">Sin pagos registrados.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.concept}</p>
                    <p className="text-xs text-slate-400">Vence {formatDate(p.dueDate)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tnum text-sm font-semibold text-slate-900">{formatCurrency(p.amount)}</span>
                    <PaymentStatusBadge status={p.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Resultado post-evento */}
      {event.status === 'completed' && (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-brand-500" />
              <div>
                <CardTitle>Resultado post-evento</CardTitle>
                <CardSubtitle>Compara lo previsto contra lo real.</CardSubtitle>
              </div>
            </div>
            <Link to={`/events/${event.id}/post-event`}>
              <Button variant="secondary" size="sm">
                {postResult ? 'Ver resultado' : 'Registrar resultado'}
              </Button>
            </Link>
          </div>
          {postResult && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Precio cobrado" value={formatCurrency(postResult.chargedPrice)} />
              <Metric label="Coste real" value={formatCurrency(postResult.realTotalCost)} />
              <Metric label="Beneficio real" value={formatCurrency(realProfit)} accent={realProfit >= 0 ? 'green' : 'red'} />
              <Metric label="Margen real" value={formatPercent(realMarginPct)} accent={realProfit >= 0 ? 'green' : 'red'} />
            </div>
          )}
        </Card>
      )}

      {event.notes && (
        <Card>
          <CardTitle>Notas internas</CardTitle>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{event.notes}</p>
        </Card>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar evento"
        message="Se eliminará el evento y sus presupuestos y pagos asociados. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={() => { deleteEvent(event.id); navigate('/events') }}
        onCancel={() => setConfirmOpen(false)}
      />

      <EventFormModal 
        open={editModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        existingEvent={event}
      />
    </div>
  )
}

function Metric({ label, value, sub, accent, icon }: { label: string; value: string; sub?: string; accent?: 'green' | 'red'; icon?: React.ReactNode }) {
  const color = accent === 'green' ? 'text-emerald-600' : accent === 'red' ? 'text-red-600' : 'text-slate-900'
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">{icon}{label}</p>
      <p className={`tnum mt-1 text-lg font-semibold ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-slate-500">{icon}{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  )
}
