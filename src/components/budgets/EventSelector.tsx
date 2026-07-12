import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../ui/PageHeader'
import { Card, CardTitle, CardSubtitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { ArrowRight, User, Calendar, Loader2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { formatDate } from '../../utils/format'

export function EventSelector({ onSelect }: { onSelect: (eventId: string) => void }) {
  const events = useStore((s) => s.events)
  const clients = useStore((s) => s.clients)

  const addClient = useStore((s) => s.addClient)
  const addEvent = useStore((s) => s.addEvent)

  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter events that don't have an accepted budget, or just show recent ones
  const recentEvents = [...events].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5)

  const handleQuickStart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName || !eventName || !eventDate) return

    setIsSubmitting(true)
    try {
      // 1. Crear cliente
      const client = await addClient({
        name: clientName,
        email: clientEmail,
        phone: '',
        company: '',
        notes: 'Creado desde presupuesto rápido',
      })

      // 2. Crear evento
      const event = await addEvent({
        clientId: client.id,
        name: eventName,
        date: eventDate,
        location: '',
        type: 'Otro',
        attendees: 50,
        durationHours: 3,
        status: 'draft',
        acceptedBudgetId: null,
        notes: '',
      })

      // 3. Continuar
      onSelect(event.id)
    } catch (err) {
      console.error(err)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Asistente"
        title="Crear presupuesto"
        description="Selecciona un evento existente o crea uno nuevo para empezar."
        actions={<Link to="/events"><Button variant="ghost" size="sm">Cancelar</Button></Link>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="mb-6">
              <CardTitle className="text-xl">Datos del cliente y evento</CardTitle>
              <CardSubtitle>Rellena lo básico para empezar a presupuestar.</CardSubtitle>
            </div>

            <form onSubmit={handleQuickStart} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <User size={14} className="text-brand-500" />
                    Nombre del cliente <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ej. María o Empresa S.A."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email (opcional)</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Calendar size={14} className="text-brand-500" />
                    Nombre del evento <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Ej. Boda María & Juan"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Fecha del evento <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="pt-6">
                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
                  Continuar al configurador <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="bg-slate-50/50 border-slate-200/60 shadow-none">
            <div className="mb-4">
              <CardTitle className="text-sm">¿Ya tienes el evento creado?</CardTitle>
            </div>
            {recentEvents.length === 0 ? (
              <p className="text-xs text-slate-500">No hay eventos recientes.</p>
            ) : (
              <ul className="space-y-2">
                {recentEvents.map((e) => (
                  <li 
                    key={e.id} 
                    className="group bg-white border border-slate-200 rounded-lg p-3 cursor-pointer hover:border-brand-300 hover:shadow-sm transition-all" 
                    onClick={() => onSelect(e.id)}
                  >
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">{e.name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(e.date)} · {clients.find(c => c.id === e.clientId)?.name ?? 'Sin cliente'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link to="/events" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                Ver todos los eventos →
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
