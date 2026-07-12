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

export function TemplateClassic({ budget, client, event, business }: Props) {
  const clientVisibleItems = budget.items.filter((it) => it.isVisibleToClient)
  const vatAmount = budget.offeredPriceWithVAT - budget.offeredPriceWithoutVAT

  return (
    <div className="print-page bg-white text-slate-800 p-12 font-sans text-sm relative">
      {/* Cabecera */}
      <header className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white mb-4">
            <span className="text-xl font-bold">M</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{business.name}</h1>
          <p className="text-slate-500">{business.tagline}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-bold text-slate-900 uppercase tracking-wider text-lg mb-2">Presupuesto</p>
          <p className="text-slate-600">Fecha: {formatDateLong(new Date().toISOString())}</p>
          <p className="text-slate-600">Ref: #{budget.id.substring(0, 6).toUpperCase()}</p>
        </div>
      </header>

      {/* Datos Cliente / Evento */}
      <div className="grid grid-cols-2 gap-12 mb-10 text-sm">
        <div>
          <h2 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2 border-b pb-1">Cliente</h2>
          <p className="font-bold text-slate-900">{client?.name || 'Cliente por defecto'}</p>
          {client?.company && <p className="text-slate-700">{client.company}</p>}
          <p className="text-slate-600">{client?.email}</p>
          <p className="text-slate-600">{client?.phone}</p>
        </div>
        <div>
          <h2 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2 border-b pb-1">Evento</h2>
          <p className="font-bold text-slate-900">{event?.name || 'Evento sin nombre'}</p>
          <p className="text-slate-700">{formatDateLong(event?.date || '')}</p>
          <p className="text-slate-600">{event?.location}</p>
          <p className="text-slate-600">{event?.attendees} invitados · {event?.durationHours}h</p>
        </div>
      </div>

      {/* Servicios */}
      <div className="mb-10">
        <h2 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-4">Servicios Incluidos</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="py-2 pr-4 font-bold text-slate-700 w-2/3">Concepto</th>
              <th className="py-2 text-right font-bold text-slate-700">Cant. / Detalle</th>
            </tr>
          </thead>
          <tbody>
            {clientVisibleItems.map(it => (
              <tr key={it.id} className="border-b border-slate-100">
                <td className="py-3 pr-4">
                  <p className="font-semibold text-slate-900">{it.name}</p>
                  <p className="text-xs text-slate-500">{it.category}</p>
                </td>
                <td className="py-3 text-right text-slate-700 font-medium">
                  {it.quantity > 1 ? `${it.quantity} ud.` : 'Servicio incluido'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totales */}
      <div className="flex justify-end mb-12 avoid-break">
        <div className="w-1/2 border rounded-lg overflow-hidden">
          <div className="flex justify-between p-3 border-b border-slate-100 text-slate-600">
            <span>Base imponible</span>
            <span className="tnum font-medium">{formatCurrency(budget.offeredPriceWithoutVAT)}</span>
          </div>
          <div className="flex justify-between p-3 border-b border-slate-100 text-slate-600">
            <span>IVA ({budget.vatPercentage}%)</span>
            <span className="tnum font-medium">{formatCurrency(vatAmount)}</span>
          </div>
          <div className="flex justify-between p-4 bg-slate-50 font-bold text-lg text-slate-900">
            <span>Total</span>
            <span className="tnum">{formatCurrency(budget.offeredPriceWithVAT)}</span>
          </div>
        </div>
      </div>

      {/* Pie / Condiciones */}
      <div className="mt-auto avoid-break text-xs text-slate-500 border-t border-slate-200 pt-6">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="font-bold text-slate-700 mb-2 uppercase tracking-wider">Forma de Pago</h4>
            <ul className="space-y-1">
              <li>• 40% a la reserva: <span className="font-medium text-slate-900">{formatCurrency(budget.offeredPriceWithVAT * 0.4)}</span></li>
              <li>• 40% a 7 días: <span className="font-medium text-slate-900">{formatCurrency(budget.offeredPriceWithVAT * 0.4)}</span></li>
              <li>• 20% al finalizar: <span className="font-medium text-slate-900">{formatCurrency(budget.offeredPriceWithVAT * 0.2)}</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-700 mb-2 uppercase tracking-wider">Condiciones Generales</h4>
            <p className="mb-1">El presupuesto es válido durante 15 días desde su fecha de emisión.</p>
            <p className="mb-1">Cualquier cambio sustancial en invitados u horarios requerirá una revisión del mismo.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
