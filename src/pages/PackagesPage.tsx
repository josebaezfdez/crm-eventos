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
import { Plus, Pencil, Trash2, Package as PackageIcon, Clock, Target, TrendingUp, Receipt } from 'lucide-react'

export default function PackagesPage() {
  const packages = useStore((s) => s.packages)
  const deletePackage = useStore((s) => s.deletePackage)
  const navigate = useNavigate()

  const [deleteId, setDeleteId] = useState<string | null>(null)

  const openNew = () => navigate('/packages/new')
  const openEdit = (p: Package) => navigate(`/packages/${p.id}/edit`)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catálogo"
        title="Paquetes"
        description="Ofertas prefabricadas con costes y margen objetivo. El punto de partida de cualquier presupuesto."
        actions={<Button onClick={openNew}><Plus size={16} /> Nuevo paquete</Button>}
      />

      {packages.length === 0 ? (
        <EmptyState title="Sin paquetes" description="Crea tu primer paquete para presupuestar más rápido." icon={<PackageIcon size={22} />} action={<Button size="sm" onClick={openNew}><Plus size={15} /> Nuevo paquete</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {packages.map((p) => {
            const margin = p.recommendedPrice > 0 ? ((p.recommendedPrice - p.baseCost) / p.recommendedPrice) * 100 : 0
            return (
              <Card key={p.id} hover>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="icon-chip-accent shrink-0"><PackageIcon size={18} /></div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{p.description}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil size={14} /></Button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Mini icon={<Clock size={13} />} label="Horas" value={`${p.baseHours}h`} />
                  <Mini icon={<Receipt size={13} />} label="Coste base" value={formatCurrency(p.baseCost)} />
                  <Mini icon={<TrendingUp size={13} />} label="Precio reco." value={formatCurrency(p.recommendedPrice)} />
                  <Mini icon={<Target size={13} />} label="Margen obj." value={formatPercent(p.marginTarget, 0)} accent={margin >= p.marginTarget ? 'green' : 'amber'} />
                </div>
                <p className="mt-3 text-xs text-slate-400">{(p.partnerIds || []).length} partners, {(p.customItems || []).length} líneas de coste</p>
                <div className="mt-3 flex justify-end">
                  <Button variant="danger" size="sm" onClick={() => setDeleteId(p.id)}><Trash2 size={14} /> Eliminar</Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar paquete"
        message="¿Seguro que quieres eliminar este paquete?"
        confirmLabel="Eliminar"
        onConfirm={() => { if (deleteId) deletePackage(deleteId); setDeleteId(null) }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}

function Mini({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: 'green' | 'amber' }) {
  const color = accent === 'green' ? 'text-emerald-600' : accent === 'amber' ? 'text-amber-600' : 'text-slate-900'
  return (
    <div className="rounded-xl bg-slate-50 p-2.5">
      <p className="flex items-center justify-center gap-1 text-[11px] text-slate-400">{icon}{label}</p>
      <p className={`tnum mt-0.5 text-sm font-semibold ${color}`}>{value}</p>
    </div>
  )
}
