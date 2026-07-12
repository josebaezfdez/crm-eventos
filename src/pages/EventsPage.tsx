import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { MarginBadge } from '../components/ui/MarginBadge'
import { EventStatusBadge } from '../components/ui/StatusBadges'
import { EmptyState } from '../components/ui/EmptyState'
import { useEventMarginRows } from '../hooks/useSelectors'
import { useStore } from '../store/useStore'
import { useViewPreference } from '../hooks/useViewPreference'
import { formatCurrency, formatDate } from '../utils/format'
import type { EventStatus } from '../types'
import { Search, Plus, CalendarDays, ArrowRight, Users, Clock } from 'lucide-react'
import { EventFormModal } from '../components/events/EventFormModal'
import { ViewToggle } from '../components/ui/ViewToggle'

export default function EventsPage() {
  const rows = useEventMarginRows()
  const setEventStatus = useStore((s) => s.setEventStatus)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [view, setView] = useViewPreference('events')

  const filtered = useMemo(() => {
    return rows
      .filter((r) => {
        const q = search.toLowerCase()
        const matchesSearch =
          !q ||
          r.event.name.toLowerCase().includes(q) ||
          (r.client?.name ?? '').toLowerCase().includes(q)
        const matchesStatus = statusFilter === 'all' || r.event.status === statusFilter
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => +new Date(b.event.date) - +new Date(a.event.date))
  }, [rows, search, statusFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Agenda"
        title="Eventos"
        description="Todos tus eventos, su estado y su rentabilidad esperada."
        actions={
          <div className="flex items-center gap-3">
            <ViewToggle view={view} onChange={setView} />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                <Plus size={16} /> Nuevo evento
              </Button>
              <Link to="/budgets/new">
                <Button><Plus size={16} /> Nuevo presupuesto</Button>
              </Link>
            </div>
          </div>
        }
      />

      <Card>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Buscar por evento o cliente…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="quoted">Presupuestado</option>
            <option value="accepted">Aceptado</option>
            <option value="rejected">Rechazado</option>
            <option value="completed">Completado</option>
          </Select>
          <div className="flex items-center justify-end text-sm text-slate-400">
            <CalendarDays size={15} className="mr-1.5" /> {filtered.length} evento(s)
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No hay eventos que mostrar"
            description="Crea un presupuesto para registrar tu primer evento."
            icon={<CalendarDays size={22} />}
            action={
              <Link to="/budgets/new">
                <Button variant="primary" size="sm"><Plus size={15} /> Crear presupuesto</Button>
              </Link>
            }
          />
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => (
              <Card key={r.event.id} hover className="p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Link to={`/events/${r.event.id}`} className="font-semibold text-slate-900 transition-colors hover:text-brand-600 block truncate">
                      {r.event.name}
                    </Link>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 truncate">
                      <CalendarDays size={12} className="shrink-0" />
                      <span>{formatDate(r.event.date)}</span>
                      {r.client && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="truncate">{r.client.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <EventStatusBadge status={r.event.status} />
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Total Ofertado</p>
                    <p className="tnum mt-0.5 font-semibold text-slate-900">{r.offered ? formatCurrency(r.offered) : '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Rentabilidad</p>
                    <div className="mt-1 flex justify-end">
                      {r.offered ? <MarginBadge margin={r.margin} /> : <span className="text-xs text-slate-400">—</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5"><Users size={11} /> {r.event.attendees}</span>
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5"><Clock size={11} /> {r.event.durationHours}h</span>
                  </div>
                  <Link to={`/events/${r.event.id}`} className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50">
                    Ver <ArrowRight size={13} />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 px-4 font-semibold">Evento & Fecha</th>
                  <th className="py-2.5 px-4 font-semibold hidden sm:table-cell">Cliente</th>
                  <th className="py-2.5 px-4 font-semibold">Estado</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Total</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Margen</th>
                  <th className="py-2.5 px-4 text-right font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.event.id} className="group border-b border-slate-50 transition-colors hover:bg-slate-50/80">
                    <td className="py-2 px-4">
                      <Link to={`/events/${r.event.id}`} className="font-medium text-slate-900 transition-colors group-hover:text-brand-600 block">
                        {r.event.name}
                      </Link>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <CalendarDays size={10} /> {formatDate(r.event.date)}
                        {r.client && <span className="sm:hidden ml-1">• {r.client.name}</span>}
                      </div>
                    </td>
                    <td className="py-2 px-4 text-[12px] text-slate-600 hidden sm:table-cell">
                      {r.client?.name ?? '—'}
                      {r.client?.company && <div className="text-[11px] text-slate-400">{r.client.company}</div>}
                    </td>
                    <td className="py-2 px-4">
                      <select
                        value={r.event.status}
                        onChange={(e) => setEventStatus(r.event.id, e.target.value as EventStatus)}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 transition-colors hover:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-500/20"
                        aria-label="Cambiar estado"
                      >
                        <option value="draft">Borrador</option>
                        <option value="quoted">Presupuestado</option>
                        <option value="accepted">Aceptado</option>
                        <option value="rejected">Rechazado</option>
                        <option value="completed">Completado</option>
                      </select>
                    </td>
                    <td className="tnum py-2 px-4 text-right">
                      <div className="font-medium text-slate-900">{r.offered ? formatCurrency(r.offered) : '—'}</div>
                      <div className="text-[10px] text-slate-400">Coste: {r.totalCost ? formatCurrency(r.totalCost) : '—'}</div>
                    </td>
                    <td className="py-2 px-4 text-right">
                      <div className="flex justify-end">
                        {r.offered ? <MarginBadge margin={r.margin} /> : <span className="text-slate-300">—</span>}
                      </div>
                    </td>
                    <td className="py-2 px-4 text-right whitespace-nowrap">
                      <Link to={`/events/${r.event.id}`} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Leyenda de margen */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-xs text-slate-500 shadow-card">
        <span className="font-semibold text-slate-600">Leyenda de margen:</span>
        <MarginBadge margin={55} /> <span>Excelente</span>
        <MarginBadge margin={40} /> <span>Rentable</span>
        <MarginBadge margin={28} /> <span>Ajustado</span>
        <MarginBadge margin={12} /> <span>No recomendable</span>
        <span className="ml-auto"><EventStatusBadge status="completed" /></span>
      </div>

      <EventFormModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  )
}
