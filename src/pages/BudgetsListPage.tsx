import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Receipt, Plus, Search, Filter, Trash2, Edit3 } from 'lucide-react'
import { formatCurrency, formatDate } from '../utils/format'
import { BudgetStatusBadge } from '../components/budgets/BudgetStatusBadge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useViewPreference } from '../hooks/useViewPreference'
import { ViewToggle } from '../components/ui/ViewToggle'

export default function BudgetsListPage() {
  const budgets = useStore(s => s.budgets)
  const events = useStore(s => s.events)
  const clients = useStore(s => s.clients)
  const deleteBudget = useStore(s => s.deleteBudget)
  
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null)
  const [view, setView] = useViewPreference('budgets')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Listado"
        title="Presupuestos"
        description="Gestión de todos los presupuestos emitidos."
        actions={
          <div className="flex items-center gap-3">
            <ViewToggle view={view} onChange={setView} />
            <Link to="/events">
              <Button>
                <Plus size={16} className="mr-2" />
                Nuevo presupuesto
              </Button>
            </Link>
          </div>
        }
      />

      {budgets.length === 0 ? (
        <EmptyState
          title="No hay presupuestos"
          description="Crea tu primer presupuesto desde la ficha de un evento."
          icon={<Receipt size={24} />}
          action={
            <Link to="/events">
              <Button size="sm">
                Ir a Eventos
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <Card className="p-0 overflow-hidden mb-4">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="relative w-full max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar presupuesto..." 
                  className="w-full pl-9 pr-4 py-1.5 text-[13px] rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                />
              </div>
              <Button variant="secondary" size="sm" className="h-8">
                <Filter size={13} className="mr-2" /> Filtros
              </Button>
            </div>
          </Card>

          {view === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {budgets.map(budget => {
                const event = events.find(e => e.id === budget.eventId)
                
                return (
                  <Card key={budget.id} hover className="p-4 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Link to={`/budgets/${budget.id}`} className="font-semibold text-slate-900 transition-colors hover:text-brand-600 block truncate">
                          PRE-{budget.id.substring(0, 6).toUpperCase()}
                        </Link>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 truncate">
                          <span className="truncate">{event?.name || 'Evento eliminado'}</span>
                        </div>
                      </div>
                      <BudgetStatusBadge status={budget.status} />
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Total Ofertado</p>
                        <p className="tnum mt-0.5 font-semibold text-slate-900">{formatCurrency(budget.offeredPriceWithVAT)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Rentabilidad</p>
                        <p className="tnum mt-0.5 font-semibold text-emerald-600">{budget.expectedMarginPercentage.toFixed(1)}%</p>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-400">
                        {formatDate(budget.createdAt)}
                      </div>
                      <div className="flex gap-1">
                        <Link to={`/budgets/${budget.id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:text-brand-600"><Edit3 size={13} /></Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => setBudgetToDelete(budget.id)}><Trash2 size={13} /></Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Presupuesto</th>
                      <th className="px-4 py-2.5 hidden sm:table-cell">Evento / Cliente</th>
                      <th className="px-4 py-2.5">Estado</th>
                      <th className="px-4 py-2.5 text-right">Total</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {budgets.map(budget => {
                      const event = events.find(e => e.id === budget.eventId)
                      const client = clients.find(c => c.id === budget.clientId)
                      
                      return (
                        <tr key={budget.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-4 py-2">
                            <Link to={`/budgets/${budget.id}`} className="font-medium text-slate-900 transition-colors hover:text-brand-600">
                              PRE-{budget.id.substring(0, 6).toUpperCase()}
                            </Link>
                            <div className="text-[11px] text-slate-500">{formatDate(budget.createdAt)}</div>
                            <div className="text-[11px] text-slate-500 sm:hidden mt-0.5 truncate max-w-[150px]">
                              {event?.name || 'Eliminado'}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-[12px] hidden sm:table-cell">
                            <div className="font-medium text-slate-900">{event?.name || 'Evento eliminado'}</div>
                            <div className="text-[11px] text-slate-500">{client?.company || client?.name || 'Cliente eliminado'}</div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <BudgetStatusBadge status={budget.status} />
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-right">
                            <div className="font-semibold text-slate-900 tnum">{formatCurrency(budget.offeredPriceWithVAT)}</div>
                            <div className="text-[10px] text-slate-400">Margen: {budget.expectedMarginPercentage.toFixed(1)}%</div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link to={`/budgets/${budget.id}/edit`}>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:text-brand-600" aria-label="Editar">
                                  <Edit3 size={13} />
                                </Button>
                              </Link>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => setBudgetToDelete(budget.id)} aria-label="Eliminar">
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!budgetToDelete}
        title="Eliminar presupuesto"
        message="¿Estás seguro de que deseas eliminar este presupuesto? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (budgetToDelete) {
            deleteBudget(budgetToDelete)
            setBudgetToDelete(null)
          }
        }}
        onCancel={() => setBudgetToDelete(null)}
      />
    </div>
  )
}
