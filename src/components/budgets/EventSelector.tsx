import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../ui/PageHeader'
import { Card, CardTitle, CardSubtitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { CalendarDays, Plus, ArrowRight } from 'lucide-react'
import { EventFormModal } from '../events/EventFormModal'
import { useStore } from '../../store/useStore'
import { formatDate } from '../../utils/format'

export function EventSelector({ onSelect }: { onSelect: (eventId: string) => void }) {
  const events = useStore((s) => s.events)
  const clients = useStore((s) => s.clients)

  const [modalOpen, setModalOpen] = useState(false)
  // Filter events that don't have an accepted budget, or just show recent ones
  const recentEvents = [...events].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 10)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Asistente"
        title="Crear presupuesto"
        description="Selecciona un evento existente o crea uno nuevo para empezar."
        actions={<Link to="/events"><Button variant="ghost" size="sm">Cancelar</Button></Link>}
      />

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <CardTitle>¿Para qué evento es este presupuesto?</CardTitle>
            <CardSubtitle>Elige uno de la lista o crea uno nuevo.</CardSubtitle>
          </div>
          <Button onClick={() => setModalOpen(true)}><Plus size={15} /> Nuevo evento</Button>
        </div>

        {recentEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <CalendarDays size={24} className="mx-auto mb-3 text-slate-400" />
            <p className="text-sm font-medium text-slate-900">No hay eventos recientes</p>
            <p className="mt-1 text-xs text-slate-500">Crea un evento nuevo para poder presupuestarlo.</p>
            <Button className="mt-4" size="sm" onClick={() => setModalOpen(true)}><Plus size={14} /> Nuevo evento</Button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 border-t border-slate-100 mt-4">
            {recentEvents.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-3 hover:bg-slate-50 px-2 -mx-2 rounded-lg cursor-pointer transition-colors" onClick={() => onSelect(e.id)}>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{e.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(e.date)} · {clients.find(c => c.id === e.clientId)?.name ?? 'Sin cliente'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-400">{e.status}</span>
                  <Button variant="secondary" size="sm">Seleccionar <ArrowRight size={14} className="ml-1" /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <EventFormModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSaved={onSelect} 
      />
    </div>
  )
}
