import { formatCurrency, formatDateLong } from '../../../utils/format'
import type { Budget, Client, Event } from '../../../types'

interface Props {
  budget: Budget
  client?: Client
  event?: Event
  business: {
    name: string
    tagline: string
    email: string
    phone: string
  }
}

export function TemplateModern({ budget, client, event, business }: Props) {
  const clientVisibleItems = budget.items.filter((it) => it.isVisibleToClient)
  const vatAmount = budget.offeredPriceWithVAT - budget.offeredPriceWithoutVAT

  return (
    <div className="print-page bg-white p-12 font-sans relative flex flex-col h-full">
      {/* Cabecera muy limpia */}
      <header className="flex justify-between items-center mb-16 avoid-break">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-slate-900 mb-1">{business.name}</h1>
          <p className="text-sm font-medium text-brand-500">{business.tagline}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Presupuesto</p>
          <p className="text-slate-900 font-medium">#{budget.id.substring(0, 6).toUpperCase()}</p>
        </div>
      </header>

      {/* Gran número central */}
      <div className="mb-12 pb-12 border-b border-slate-100 text-center avoid-break">
        <p className="text-sm text-slate-500 mb-2">Importe Total (IVA inc.)</p>
        <p className="text-6xl font-light tracking-tighter text-slate-900 tnum">{formatCurrency(budget.offeredPriceWithVAT)}</p>
      </div>

      <div className="grid grid-cols-2 gap-16 mb-12">
        <div className="space-y-8">
          {/* Para */}
          <div className="avoid-break">
            <h2 className="text-xs uppercase tracking-widest text-slate-400 mb-3 font-semibold">Preparado para</h2>
            <p className="text-lg font-medium text-slate-900 mb-1">{client?.name}</p>
            {client?.company && <p className="text-slate-600 mb-1">{client.company}</p>}
            <p className="text-sm text-slate-500">{client?.email}</p>
          </div>
          {/* Detalles del evento */}
          <div className="avoid-break">
            <h2 className="text-xs uppercase tracking-widest text-slate-400 mb-3 font-semibold">Detalles del Evento</h2>
            <p className="text-base text-slate-900 font-medium mb-1">{event?.name}</p>
            <p className="text-sm text-slate-600 mb-1">{formatDateLong(event?.date || '')}</p>
            <p className="text-sm text-slate-500">{event?.location}</p>
          </div>
        </div>

        {/* Breakdown muy limpio */}
        <div>
          <h2 className="text-xs uppercase tracking-widest text-slate-400 mb-6 font-semibold avoid-break">Desglose de Servicios</h2>
          <div className="space-y-4">
            {clientVisibleItems.map(it => (
              <div key={it.id} className="flex justify-between items-start avoid-break">
                <div>
                  <p className="font-medium text-slate-900">{it.name}</p>
                  <p className="text-xs text-slate-500">{it.category}</p>
                </div>
                <p className="text-sm text-slate-500">{it.quantity > 1 ? `${it.quantity} ud.` : ''}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 space-y-3 avoid-break">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Base imponible</span>
              <span className="tnum">{formatCurrency(budget.offeredPriceWithoutVAT)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>IVA ({budget.vatPercentage}%)</span>
              <span className="tnum">{formatCurrency(vatAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pie de página en el bottom absolute o mt-auto */}
      <footer className="mt-12 pt-8 border-t border-slate-100 flex justify-between text-xs text-slate-400 avoid-break">
        <div>
          <p className="font-medium text-slate-900 mb-1">Pagos</p>
          <p>40% Reserva · 40% a 7 días · 20% Cierre</p>
        </div>
        <div className="text-right">
          <p>{business.email}</p>
          <p>{business.phone}</p>
        </div>
      </footer>
    </div>
  )
}
