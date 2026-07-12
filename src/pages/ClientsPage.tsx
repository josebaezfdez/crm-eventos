import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, TextArea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { useStore } from '../store/useStore'
import { useEventsForClient } from '../hooks/useSelectors'
import { useViewPreference } from '../hooks/useViewPreference'
import { formatCurrency, formatDate } from '../utils/format'
import type { Client } from '../types'
import { Plus, Pencil, Trash2, Users, Mail, Phone, Building2, CalendarDays, ArrowRight } from 'lucide-react'
import { ViewToggle } from '../components/ui/ViewToggle'

const emptyForm = { name: '', email: '', phone: '', company: '', notes: '' }

export default function ClientsPage() {
  const clients = useStore((s) => s.clients)
  const events = useStore((s) => s.events)
  const budgets = useStore((s) => s.budgets)
  const addClient = useStore((s) => s.addClient)
  const updateClient = useStore((s) => s.updateClient)
  const deleteClient = useStore((s) => s.deleteClient)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [view, setView] = useViewPreference('clients')

  const openNew = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true) }
  const openEdit = (c: Client) => {
    setForm({ name: c.name, email: c.email, phone: c.phone, company: c.company, notes: c.notes })
    setEditingId(c.id); setModalOpen(true)
  }
  const [isSaving, setIsSaving] = useState(false)
  const save = async () => {
    if (!form.name.trim()) return
    setIsSaving(true)
    try {
      if (editingId) await updateClient(editingId, form)
      else await addClient(form)
      setModalOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  const clientStats = useMemo(() => {
    return clients.map((c) => {
      const evs = events.filter((e) => e.clientId === c.id)
      const totalBudgeted = evs.reduce((acc, e) => acc + (budgets.find((bb) => bb.id === e.acceptedBudgetId)?.offeredPriceWithVAT ?? 0), 0)
      const totalAccepted = evs.filter((e) => e.status === 'accepted' || e.status === 'completed')
        .reduce((acc, e) => acc + (budgets.find((bb) => bb.id === e.acceptedBudgetId)?.offeredPriceWithVAT ?? 0), 0)
      return { client: c, eventCount: evs.length, totalBudgeted, totalAccepted }
    })
  }, [clients, events, budgets])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Contactos"
        title="Clientes"
        description="Tu base de contactos. Cada cliente muestra su historial de eventos."
        actions={
          <div className="flex items-center gap-3">
            <ViewToggle view={view} onChange={setView} />
            <Button onClick={openNew}><Plus size={16} /> Nuevo cliente</Button>
          </div>
        }
      />

      {clients.length === 0 ? (
        <EmptyState title="Sin clientes" description="Añade tu primer cliente para empezar a presupuestar." icon={<Users size={22} />} action={<Button size="sm" onClick={openNew}><Plus size={15} /> Nuevo cliente</Button>} />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clientStats.map(({ client: c, eventCount, totalBudgeted, totalAccepted }) => (
            <Card key={c.id} hover className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-brand-100 to-accent-100 text-sm font-bold text-brand-700 ring-1 ring-inset ring-brand-100">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{c.name}</p>
                    {c.company && <p className="flex items-center gap-1 text-[11px] text-slate-500"><Building2 size={12} /> {c.company}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(c)}><Pencil size={13} /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => setDeleteId(c.id)}><Trash2 size={13} /></Button>
                </div>
              </div>

              <dl className="mt-4 space-y-1 text-[13px] text-slate-600">
                <div className="flex items-center gap-2"><Mail size={13} className="text-slate-400" /> <span className="truncate">{c.email || '—'}</span></div>
                <div className="flex items-center gap-2"><Phone size={13} className="text-slate-400" /> {c.phone || '—'}</div>
              </dl>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Stat label="Eventos" value={String(eventCount)} icon={<CalendarDays size={13} />} />
                <Stat label="Presupuestado" value={formatCurrency(totalBudgeted)} />
                <Stat label="Aceptado" value={formatCurrency(totalAccepted)} accent={totalAccepted > 0 ? 'green' : undefined} />
              </div>

              {eventCount > 0 && <ClientEventsList clientId={c.id} />}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="px-4 py-2">Cliente</th>
                  <th className="px-4 py-2">Contacto</th>
                  <th className="px-4 py-2 text-right">Eventos</th>
                  <th className="px-4 py-2 text-right">Presupuestado</th>
                  <th className="px-4 py-2 text-right">Aceptado</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientStats.map(({ client: c, eventCount, totalBudgeted, totalAccepted }) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-gradient-to-br from-brand-100 to-accent-100 text-xs font-bold text-brand-700 ring-1 ring-inset ring-brand-100">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{c.name}</div>
                          {c.company && <div className="text-[11px] text-slate-500">{c.company}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-[12px] text-slate-600">
                      <div>{c.email || '—'}</div>
                      <div>{c.phone || '—'}</div>
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-slate-700">
                      {eventCount}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-600">
                      {formatCurrency(totalBudgeted)}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-emerald-600">
                      {totalAccepted > 0 ? formatCurrency(totalAccepted) : '—'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-brand-600" onClick={() => openEdit(c)}>
                          <Pencil size={13} />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => setDeleteId(c.id)}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar cliente' : 'Nuevo cliente'}
        description="Datos de contacto del cliente."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={save} isLoading={isSaving} disabled={!form.name.trim() || isSaving}>Guardar</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Empresa" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div className="sm:col-span-2">
            <TextArea label="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar cliente"
        message="¿Seguro que quieres eliminar este cliente? Los eventos asociados no se borrarán."
        confirmLabel="Eliminar"
        onConfirm={() => { if (deleteId) deleteClient(deleteId); setDeleteId(null) }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}

function Stat({ label, value, accent, icon }: { label: string; value: string; accent?: 'green'; icon?: React.ReactNode }) {
  const color = accent === 'green' ? 'text-emerald-600' : 'text-slate-900'
  return (
    <div className="rounded-md bg-slate-50 p-2">
      <p className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-slate-400">{icon}{label}</p>
      <p className={`tnum mt-0.5 text-[13px] font-semibold ${color}`}>{value}</p>
    </div>
  )
}

function ClientEventsList({ clientId }: { clientId: string }) {
  const events = useEventsForClient(clientId)
  if (events.length === 0) return null
  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Eventos asociados</p>
      <ul className="space-y-1">
        {events.slice(0, 3).map((e) => (
          <li key={e.id}>
            <Link to={`/events/${e.id}`} className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
              <span className="truncate text-slate-700 group-hover:text-slate-900">{e.name}</span>
              <span className="flex items-center gap-1 text-xs text-slate-400">{formatDate(e.date)} <ArrowRight size={12} className="opacity-0 transition-opacity group-hover:opacity-100" /></span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
