import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { MarginBadge } from '../components/ui/MarginBadge'
import { BudgetStatusBadge } from '../components/ui/StatusBadges'
import { ComingSoon, EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useBudget, useClient, useEvent } from '../hooks/useSelectors'
import { useStore as useAppStore } from '../store/useStore'
import { formatCurrency, formatDate, formatDateLong } from '../utils/format'
import { getImageUrl } from '../utils/images'
import { ArrowLeft, FileDown, Send, Receipt, Eye, ShieldCheck, Edit3, Trash2 } from 'lucide-react'

const DEFAULT_BUSINESS = {
  name: 'EventMargin',
  tagline: 'SaaS de Presupuestación',
  email: 'hola@eventmargin.com',
  phone: '+34 600 00 00 00',
}

const CONDITIONS = [
  '40% para reservar fecha.',
  '40% siete días antes del evento.',
  '20% al finalizar el evento.',
  'Las horas extra se facturarán aparte.',
  'Cambios de alcance pueden modificar el presupuesto.',
  'La reserva queda confirmada tras el pago inicial.',
]

export default function BudgetViewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const budget = useBudget(id)
  const event = useEvent(budget?.eventId)
  const client = useClient(budget?.clientId)
  const updateBudget = useAppStore((s) => s.updateBudget)
  const deleteBudget = useAppStore((s) => s.deleteBudget)
  const settings = useAppStore((s) => s.settings)

  const business = {
    name: settings?.name || DEFAULT_BUSINESS.name,
    tagline: settings?.email ? '' : DEFAULT_BUSINESS.tagline,
    email: settings?.email || DEFAULT_BUSINESS.email,
    phone: settings?.phone || DEFAULT_BUSINESS.phone,
  }

  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!budget) {
    return (
      <EmptyState
        title="Presupuesto no encontrado"
        action={<Link to="/events"><Button variant="secondary" size="sm">Volver a eventos</Button></Link>}
      />
    )
  }

  const clientVisibleItems = budget.items.filter((it) => it.isVisibleToClient)
  const vatAmount = budget.offeredPriceWithVAT - budget.offeredPriceWithoutVAT

  const setStatus = (status: 'draft' | 'sent' | 'accepted' | 'rejected') =>
    updateBudget(budget.id, { status })

  return (
    <div className="space-y-6">
      {/* Barra interna */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link to="/events"><Button variant="ghost" size="sm"><ArrowLeft size={15} /> Eventos</Button></Link>
          {event && <Link to={`/events/${event.id}`}><Button variant="secondary" size="sm">Ver evento</Button></Link>}
          <BudgetStatusBadge status={budget.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MarginBadge margin={budget.expectedMarginPercentage} />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            <Eye size={12} /> Vista interna
          </span>
          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>
          <Link to={`/budgets/${budget.id}/edit`}>
            <Button variant="secondary" size="sm"><Edit3 size={15} /> Editar</Button>
          </Link>
          <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}><Trash2 size={15} /> Eliminar</Button>
        </div>
      </div>

      {/* Documento profesional */}
      <Card padded={false} className="overflow-hidden">
        {/* Cabecera */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-glow overflow-hidden">
                {settings?.darkLogoUrl || settings?.lightLogoUrl ? (
                  <img src={getImageUrl(settings.darkLogoUrl || settings.lightLogoUrl)} alt={business.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base font-bold">{business.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="text-base font-bold tracking-tight text-slate-900">{business.name}</p>
                {business.tagline && <p className="text-xs text-slate-400">{business.tagline}</p>}
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">{business.email} · {business.phone}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-wider text-slate-400">Presupuesto</p>
            <p className="tnum text-2xl font-bold tracking-tight text-slate-900">{formatCurrency(budget.offeredPriceWithVAT)}</p>
            <p className="text-xs text-slate-400">IVA {budget.vatPercentage}% incluido</p>
            <p className="mt-1 text-xs text-slate-400">Fecha: {formatDate(new Date().toISOString())}</p>
          </div>
        </div>

        {/* Cliente + evento */}
        <div className="grid grid-cols-1 gap-6 border-b border-slate-100 p-6 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Cliente</p>
            <p className="mt-1.5 font-semibold text-slate-900">{client?.name ?? '—'}</p>
            {client?.company && <p className="text-sm text-slate-600">{client.company}</p>}
            <p className="text-sm text-slate-500">{client?.email}</p>
            <p className="text-sm text-slate-500">{client?.phone}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-wider text-slate-400">Evento</p>
            <p className="mt-1.5 font-semibold text-slate-900">{event?.name ?? '—'}</p>
            <p className="text-sm text-slate-600">{formatDateLong(event?.date ?? '')}</p>
            <p className="text-sm text-slate-500">{event?.location}</p>
            <p className="text-sm text-slate-500">{event?.attendees} invitados · {event?.durationHours}h</p>
          </div>
        </div>

        {/* Servicios */}
        <div className="p-6">
          <p className="text-xs uppercase tracking-wider text-slate-400">Servicios incluidos</p>
          <ul className="mt-3 divide-y divide-slate-100">
            {clientVisibleItems.map((it) => (
              <li key={it.id} className="flex items-start justify-between py-3">
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{it.name}</p>
                    <p className="text-xs text-slate-400">{it.category}</p>
                  </div>
                </div>
                <span className="text-sm text-slate-500">{it.quantity > 1 ? `${it.quantity} ud.` : 'Incluido'}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck size={13} /> El importe de los servicios coincide con la base imponible.
          </p>
        </div>

        {/* Totales */}
        <div className="border-t border-slate-100 bg-gradient-to-br from-slate-50 to-brand-50/30 p-6">
          <div className="ml-auto max-w-sm space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Base imponible</span>
              <span className="tnum">{formatCurrency(budget.offeredPriceWithoutVAT)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>IVA ({budget.vatPercentage}%)</span>
              <span className="tnum">{formatCurrency(vatAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2.5 text-base font-bold text-slate-900">
              <span>Total</span>
              <span className="tnum">{formatCurrency(budget.offeredPriceWithVAT)}</span>
            </div>
          </div>
        </div>

        {/* Pago + condiciones */}
        <div className="grid grid-cols-1 gap-6 border-t border-slate-100 p-6 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Forma de pago recomendada</p>
            <ul className="mt-2.5 space-y-1.5 text-sm text-slate-600">
              <li>• 40% para reservar fecha · <span className="tnum">{formatCurrency(budget.offeredPriceWithVAT * 0.4)}</span></li>
              <li>• 40% 7 días antes · <span className="tnum">{formatCurrency(budget.offeredPriceWithVAT * 0.4)}</span></li>
              <li>• 20% al finalizar · <span className="tnum">{formatCurrency(budget.offeredPriceWithVAT * 0.2)}</span></li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Condiciones comerciales</p>
            <ul className="mt-2.5 space-y-1.5 text-sm text-slate-600">
              {CONDITIONS.map((c) => <li key={c}>• {c}</li>)}
            </ul>
          </div>
        </div>
      </Card>

      {/* Acciones internas */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-slate-900">Acciones del presupuesto</p>
            <p className="text-sm text-slate-500">Cambia el estado según avances con el cliente.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={budget.status === 'sent' ? 'primary' : 'secondary'} onClick={() => setStatus('sent')}>Marcar enviado</Button>
            <Button size="sm" variant={budget.status === 'accepted' ? 'primary' : 'secondary'} onClick={() => setStatus('accepted')}>Marcar aceptado</Button>
            <Button size="sm" variant={budget.status === 'rejected' ? 'primary' : 'secondary'} onClick={() => setStatus('rejected')}>Marcar rechazado</Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link to={`/budgets/${budget.id}/pdf`} className="flex flex-col items-start gap-1 rounded-xl border border-brand-200 bg-brand-50 p-4 text-left transition-colors hover:border-brand-300 hover:bg-brand-100 group">
            <div className="flex items-center gap-2 font-medium text-brand-900">
              <FileDown size={14} className="text-brand-600 transition-transform group-hover:-translate-y-0.5" /> Exportar a PDF
            </div>
            <p className="text-xs text-brand-600/80">3 diseños disponibles</p>
          </Link>
          <ComingSoon icon={<Send size={14} />} label="Enviar por email" description="al cliente" />
          <ComingSoon icon={<Receipt size={14} />} label="Subir ticket / factura" description="lectura automática" />
        </div>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar presupuesto"
        message="¿Estás seguro de que deseas eliminar este presupuesto? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={() => {
          deleteBudget(budget.id)
          navigate('/budgets')
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
