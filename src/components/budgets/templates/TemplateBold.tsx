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

export function TemplateBold({ budget, client, event, business }: Props) {
  const clientVisibleItems = budget.items.filter((it) => it.isVisibleToClient)
  const vatAmount = budget.offeredPriceWithVAT - budget.offeredPriceWithoutVAT

  return (
    <div className="print-page bg-white font-sans text-sm relative p-8">
      {/* Cabecera Oscura "Malatesta Style" (Margin-safe card) */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-md mb-10 avoid-break">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg">
              <span className="text-3xl font-bold">M</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-1">{business.name}</h1>
              <p className="text-brand-300 text-sm font-medium">{business.tagline}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block border border-white/20 rounded-full px-4 py-1.5 mb-3 text-xs uppercase tracking-widest font-bold">
              Presupuesto
            </div>
            <p className="text-slate-400 text-xs">Fecha: <span className="text-white">{formatDateLong(new Date().toISOString())}</span></p>
            <p className="text-slate-400 text-xs mt-1">Ref: <span className="text-white">#{budget.id.substring(0, 8).toUpperCase()}</span></p>
          </div>
        </div>
      </div>

      <div className="px-2">
        {/* Box destacado para el evento y cliente */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 mb-10 flex justify-between items-start avoid-break">
          <div>
            <p className="text-brand-600 font-bold text-xs uppercase tracking-widest mb-3">Para</p>
            <p className="text-2xl font-bold text-slate-900">{client?.name}</p>
            <p className="text-slate-600">{client?.email} · {client?.phone}</p>
          </div>
          <div className="text-right max-w-[50%]">
            <p className="text-brand-600 font-bold text-xs uppercase tracking-widest mb-3">El Evento</p>
            <p className="text-lg font-bold text-slate-900">{event?.name}</p>
            <p className="text-slate-600">{formatDateLong(event?.date || '')} · {event?.location}</p>
            <p className="text-slate-500 mt-1">{event?.attendees} personas · {event?.durationHours} horas</p>
          </div>
        </div>

        {/* Tabla de servicios con estilo bold */}
        <div className="mb-12">
          <table className="w-full text-left">
            <thead>
              <tr className="avoid-break">
                <th className="py-3 px-4 bg-slate-900 text-white font-semibold rounded-l-lg w-3/4">Servicio</th>
                <th className="py-3 px-4 bg-slate-900 text-white font-semibold rounded-r-lg text-right">Cant.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientVisibleItems.map(it => (
                <tr key={it.id} className="avoid-break">
                  <td className="py-4 px-4">
                    <p className="font-bold text-slate-900 text-base">{it.name}</p>
                    <p className="text-sm text-slate-500">{it.category}</p>
                  </td>
                  <td className="py-4 px-4 text-right font-medium text-slate-700">
                    {it.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumen de totales */}
        <div className="flex justify-end avoid-break mb-16">
          <div className="w-full sm:w-1/2">
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-slate-600 px-4">
                <span>Subtotal</span>
                <span className="tnum">{formatCurrency(budget.offeredPriceWithoutVAT)}</span>
              </div>
              <div className="flex justify-between text-slate-600 px-4">
                <span>IVA ({budget.vatPercentage}%)</span>
                <span className="tnum">{formatCurrency(vatAmount)}</span>
              </div>
            </div>
            <div className="bg-brand-500 text-white rounded-2xl p-6 flex justify-between items-center shadow-md">
              <span className="font-bold uppercase tracking-wider text-sm">Total a Pagar</span>
              <span className="text-2xl font-bold tnum">{formatCurrency(budget.offeredPriceWithVAT)}</span>
            </div>
          </div>
        </div>

        {/* Condiciones (Bottom) */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-12 avoid-break text-xs text-slate-600">
          <div>
            <p className="font-bold text-slate-900 uppercase tracking-widest mb-3">Contacto</p>
            <p>{business.email}</p>
            <p>{business.phone}</p>
          </div>
          <div>
            <p className="font-bold text-slate-900 uppercase tracking-widest mb-3">Condiciones & Pagos</p>
            <ul className="space-y-1">
              <li>• 40% a la confirmación de la fecha.</li>
              <li>• 40% a 7 días de la celebración.</li>
              <li>• 20% al finalizar el servicio.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
