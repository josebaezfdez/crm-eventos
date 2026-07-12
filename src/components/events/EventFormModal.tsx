import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useStore } from '../../store/useStore'
import type { EventType, Event } from '../../types'

interface EventFormModalProps {
  open: boolean
  onClose: () => void
  existingEvent?: Event
  onSaved?: (eventId: string) => void
}

export function EventFormModal({ open, onClose, existingEvent, onSaved }: EventFormModalProps) {
  const clients = useStore((s) => s.clients)
  const addEvent = useStore((s) => s.addEvent)
  const updateEvent = useStore((s) => s.updateEvent)

  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    type: 'Boda' as EventType,
    attendees: 100,
    durationHours: 3,
    notes: '',
  })

  useEffect(() => {
    if (existingEvent && open) {
      setForm({
        name: existingEvent.name,
        clientId: existingEvent.clientId,
        date: existingEvent.date,
        location: existingEvent.location,
        type: existingEvent.type,
        attendees: existingEvent.attendees,
        durationHours: existingEvent.durationHours,
        notes: existingEvent.notes || '',
      })
    } else if (open && !existingEvent) {
      setForm({
        name: '',
        clientId: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        type: 'Boda',
        attendees: 100,
        durationHours: 3,
        notes: '',
      })
    }
  }, [existingEvent, open])

  const saveEvent = async () => {
    if (!form.name || !form.clientId || !form.date) return
    setIsSaving(true)
    try {
      if (existingEvent) {
        await updateEvent(existingEvent.id, form)
        if (onSaved) onSaved(existingEvent.id)
      } else {
        const ev = await addEvent({
          ...form,
          status: 'draft',
          acceptedBudgetId: null,
          notes: form.notes
        })
        if (onSaved) onSaved(ev.id)
      }
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existingEvent ? 'Editar evento' : 'Nuevo evento'}
      description="Introduce los datos básicos del evento."
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={saveEvent} isLoading={isSaving} disabled={!form.name || !form.clientId || !form.date || isSaving}>
            {existingEvent ? 'Guardar cambios' : 'Crear evento'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Nombre del evento" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} />
        
        <div>
          <label className="label-base">Cliente</label>
          <select
            value={form.clientId}
            onChange={(e: any) => setForm({ ...form, clientId: e.target.value })}
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-all hover:border-brand-300 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
          >
            <option value="" disabled>Seleccionar cliente...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {clients.length === 0 && <p className="mt-1 text-xs text-amber-600">Debes crear un cliente primero.</p>}
        </div>

        <Input label="Fecha" type="date" value={form.date} onChange={(e: any) => setForm({ ...form, date: e.target.value })} />
        <Input label="Ubicación" value={form.location} onChange={(e: any) => setForm({ ...form, location: e.target.value })} />
        
        <div>
          <label className="label-base">Tipo de evento</label>
          <select
            value={form.type}
            onChange={(e: any) => setForm({ ...form, type: e.target.value as EventType })}
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-all hover:border-brand-300 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
          >
            <option value="Boda">Boda</option>
            <option value="Cumpleaños">Cumpleaños</option>
            <option value="Empresa">Empresa</option>
            <option value="Afterwork">Afterwork</option>
            <option value="Fiesta privada">Fiesta privada</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Asistentes" type="number" min={1} value={form.attendees} onChange={(e: any) => setForm({ ...form, attendees: Number(e.target.value) })} />
          <Input label="Duración (h)" type="number" min={1} value={form.durationHours} onChange={(e: any) => setForm({ ...form, durationHours: Number(e.target.value) })} />
        </div>
      </div>
    </Modal>
  )
}
