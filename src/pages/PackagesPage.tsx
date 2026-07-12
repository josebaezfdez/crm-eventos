import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { useStore } from '../store/useStore'
import { formatCurrency, formatPercent } from '../utils/format'
import type { Package } from '../types'
import { Plus, Trash2, Package as PackageIcon, Clock, MoreVertical, Edit3 } from 'lucide-react'

export default function PackagesPage() {
  const packages = useStore((s) => s.packages)
  const deletePackage = useStore((s) => s.deletePackage)
  const navigate = useNavigate()

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const openNew = () => navigate('/packages/new')
  const openEdit = (p: Package) => navigate(`/packages/${p.id}/edit`)

  const confirmDelete = (id: string) => {
    setDeleteId(id)
    setMenuOpenId(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paquetes"
        description="Ofertas prefabricadas con costes y margen objetivo. El punto de partida de cualquier presupuesto."
        actions={<Button onClick={openNew} className="bg-brand-600 hover:bg-brand-700 text-white"><Plus size={16} className="mr-2" /> Nuevo paquete</Button>}
      />

      {packages.length === 0 ? (
        <EmptyState title="Sin paquetes" description="Crea tu primer paquete para presupuestar más rápido." icon={<PackageIcon size={22} />} action={<Button size="sm" onClick={openNew}><Plus size={15} className="mr-2"/> Nuevo paquete</Button>} />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Paquete</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Horas</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Coste Base</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Precio Rec.</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Margen Obj.</th>
                  <th scope="col" className="px-6 py-4 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {packages.map((p) => {
                  const margin = p.recommendedPrice > 0 ? ((p.recommendedPrice - p.baseCost) / p.recommendedPrice) * 100 : 0
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">{p.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                           <Clock size={14} className="text-slate-400"/> {p.baseHours}h
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {formatCurrency(p.baseCost)}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {formatCurrency(p.recommendedPrice)}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`font-medium ${margin >= p.marginTarget ? 'text-emerald-600' : 'text-amber-600'}`}>
                           {formatPercent(p.marginTarget, 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <div className="flex justify-end relative">
                           <button 
                              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                              onClick={() => setMenuOpenId(menuOpenId === p.id ? null : p.id)}
                           >
                              <MoreVertical size={18} />
                           </button>

                           {menuOpenId === p.id && (
                             <>
                               <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                               <div className="absolute right-0 top-8 z-20 w-36 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                                  <button
                                    className="group flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                                    onClick={() => openEdit(p)}
                                  >
                                    <Edit3 size={14} className="mr-2 text-slate-400 group-hover:text-brand-500" />
                                    Editar
                                  </button>
                                  <button
                                    className="group flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    onClick={() => confirmDelete(p.id)}
                                  >
                                    <Trash2 size={14} className="mr-2 text-red-500" />
                                    Eliminar
                                  </button>
                               </div>
                             </>
                           )}
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

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar paquete"
        message="¿Seguro que quieres eliminar este paquete? Ya no se podrá usar como plantilla en nuevos presupuestos."
        confirmLabel="Eliminar"
        onConfirm={() => { if (deleteId) deletePackage(deleteId); setDeleteId(null) }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
