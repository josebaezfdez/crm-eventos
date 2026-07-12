import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardTitle, CardSubtitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, TextArea } from '../components/ui/Input'
import { useStore } from '../store/useStore'
import { formatCurrency } from '../utils/format'
import { itemTotal } from '../utils/marginCalculator'
import { BUDGET_ITEM_CATEGORIES } from '../components/budgets/BudgetItemsEditor'
import type { PackageItem, BudgetItemCategory } from '../types'
import { Plus, X, ArrowLeft } from 'lucide-react'

const emptyForm = {
  name: '', description: '', baseHours: 3, baseCost: 0,
  recommendedPrice: 0, marginTarget: 40, partnerIds: [] as string[], customItems: [] as PackageItem[],
}

export default function PackageFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const packages = useStore((s) => s.packages)
  const partners = useStore((s) => s.partners)
  const addPackage = useStore((s) => s.addPackage)
  const updatePackage = useStore((s) => s.updatePackage)
  
  const [form, setForm] = useState(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = Boolean(id)

  useEffect(() => {
    if (isEditing && packages.length > 0) {
      const p = packages.find(pkg => pkg.id === id)
      if (p) {
        setForm({
          name: p.name, description: p.description, baseHours: p.baseHours, baseCost: p.baseCost,
          recommendedPrice: p.recommendedPrice, marginTarget: p.marginTarget,
          partnerIds: [...(p.partnerIds || [])],
          customItems: (p.customItems || []).map((it) => ({ ...it })),
        })
      } else {
        navigate('/settings?tab=packages')
      }
    }
  }, [id, packages, isEditing, navigate])

  const save = async () => {
    if (!form.name.trim()) return
    setIsSaving(true)
    try {
      if (isEditing && id) {
        await updatePackage(id, form)
      } else {
        await addPackage(form)
      }
      navigate('/settings?tab=packages')
    } finally {
      setIsSaving(false)
    }
  }

  const updateItem = (idx: number, patch: Partial<PackageItem>) => {
    setForm({ ...form, customItems: form.customItems.map((it, i) => (i === idx ? { ...it, ...patch } : it)) })
  }
  
  const addItem = () => {
    setForm({ ...form, customItems: [...form.customItems, { name: 'Nueva línea', category: 'Otros', quantity: 1, unitCost: 0, unitPrice: 0, isVisibleToClient: true }] })
  }
  
  const removeItem = (idx: number) => {
    setForm({ ...form, customItems: form.customItems.filter((_, i) => i !== idx) })
  }

  const togglePartner = (pid: string) => {
    setForm((prev) => ({
      ...prev,
      partnerIds: prev.partnerIds.includes(pid) ? prev.partnerIds.filter((id) => id !== pid) : [...prev.partnerIds, pid]
    }))
  }

  const calculatePartnersCost = (hours: number, selectedPartnerIds: string[]) => {
    return selectedPartnerIds.reduce((sum, pid) => {
      const p = partners.find(pt => pt.id === pid)
      if (!p) return sum
      return sum + (p.pricingType === 'fixed' ? p.fixedRate : p.hourlyRate * hours)
    }, 0)
  }

  const itemsTotal = form.customItems.reduce((acc, it) => acc + itemTotal(it.quantity, it.unitCost), 0)
  const partnersTotal = calculatePartnersCost(form.baseHours, form.partnerIds)
  const totalCalculatedBaseCost = itemsTotal + partnersTotal

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/settings?tab=packages')} className="px-2">
          <ArrowLeft size={16} />
        </Button>
        <PageHeader
          title={isEditing ? 'Editar paquete' : 'Nuevo paquete'}
          description="Configura los detalles del paquete, añade partners e ítems de coste."
        />
      </div>

      <div className="space-y-6">
        <Card>
          <CardTitle className="mb-4">Información Principal</CardTitle>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input label="Nombre del paquete" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            </div>
            <div className="sm:col-span-2">
              <TextArea label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <Input label="Horas base" type="number" min={0} step="0.5" value={form.baseHours} onChange={(e) => setForm({ ...form, baseHours: Number(e.target.value) })} />
            <Input label="Precio recomendado (€)" type="number" min={0} value={form.recommendedPrice} onChange={(e) => setForm({ ...form, recommendedPrice: Number(e.target.value) })} />
            <Input label="Margen objetivo (%)" type="number" min={0} max={100} value={form.marginTarget} onChange={(e) => setForm({ ...form, marginTarget: Number(e.target.value) })} />
            <Input label="Coste base (€)" type="number" min={0} value={form.baseCost} onChange={(e) => setForm({ ...form, baseCost: Number(e.target.value) })} />
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-2">Partners incluidos</CardTitle>
          <CardSubtitle className="mb-4">Selecciona los partners que darán servicio en este paquete.</CardSubtitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {partners.map(p => {
              const checked = form.partnerIds.includes(p.id)
              const cost = p.pricingType === 'fixed' ? p.fixedRate : p.hourlyRate * form.baseHours
              return (
                <label key={p.id} className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${checked ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-200 bg-white'}`}>
                  <input type="checkbox" className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4" checked={checked} onChange={() => togglePartner(p.id)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.category} · {formatCurrency(cost)}</p>
                  </div>
                </label>
              )
            })}
          </div>
          {partners.length === 0 && <p className="text-sm text-slate-500">No hay partners creados. Ve a la sección Partners.</p>}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <CardTitle>Líneas de coste incluidas</CardTitle>
              <CardSubtitle>Añade costes adicionales (material, desplazamiento, dietas, etc).</CardSubtitle>
            </div>
            <Button variant="secondary" onClick={addItem}><Plus size={16} className="mr-2" /> Añadir línea</Button>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Concepto</th>
                  <th className="py-3 px-4 text-right">Cant.</th>
                  <th className="py-3 px-4 text-right">Coste ud.</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Visible Cliente</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {form.customItems.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-4">
                      <select value={it.category} onChange={(e) => updateItem(idx, { category: e.target.value as BudgetItemCategory })} className="w-full rounded-md border-slate-200 text-sm focus:border-brand-500 focus:ring-brand-500 py-1.5">
                        {BUDGET_ITEM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="py-2 px-4">
                      <input value={it.name} onChange={(e) => updateItem(idx, { name: e.target.value })} className="w-full rounded-md border-slate-200 text-sm focus:border-brand-500 focus:ring-brand-500 py-1.5" />
                    </td>
                    <td className="py-2 px-4">
                      <input type="number" min={0} value={it.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} className="w-16 ml-auto block rounded-md border-slate-200 text-right text-sm focus:border-brand-500 focus:ring-brand-500 py-1.5" />
                    </td>
                    <td className="py-2 px-4">
                      <input type="number" min={0} step="0.01" value={it.unitCost} onChange={(e) => updateItem(idx, { unitCost: Number(e.target.value) })} className="w-20 ml-auto block rounded-md border-slate-200 text-right text-sm focus:border-brand-500 focus:ring-brand-500 py-1.5" />
                    </td>
                    <td className="tnum py-2 px-4 text-right font-medium text-slate-700">{formatCurrency(itemTotal(it.quantity, it.unitCost))}</td>
                    <td className="py-2 px-4 text-center">
                      <input type="checkbox" checked={it.isVisibleToClient} onChange={(e) => updateItem(idx, { isVisibleToClient: e.target.checked })} className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4" />
                    </td>
                    <td className="py-2 px-4 text-right">
                      <button onClick={() => removeItem(idx)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"><X size={16} /></button>
                    </td>
                  </tr>
                ))}
                {form.customItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                      No se han añadido líneas de coste adicionales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg bg-slate-50 p-4 border border-slate-100 text-sm">
            <Button variant="secondary" onClick={() => setForm({ ...form, baseCost: totalCalculatedBaseCost })}>
              Usar suma calculada: {formatCurrency(totalCalculatedBaseCost)}
            </Button>
            <div className="text-right text-slate-500">
              Líneas: {formatCurrency(itemsTotal)} + Partners: {formatCurrency(partnersTotal)} = <span className="font-semibold text-slate-900 text-base ml-1">{formatCurrency(totalCalculatedBaseCost)}</span>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3 sticky bottom-6 bg-white/80 backdrop-blur p-4 rounded-xl shadow-lg ring-1 ring-slate-900/5">
          <Button variant="secondary" onClick={() => navigate('/settings?tab=packages')} disabled={isSaving}>Cancelar</Button>
          <Button onClick={save} isLoading={isSaving} disabled={!form.name.trim() || isSaving}>
            {isEditing ? 'Guardar Cambios' : 'Crear Paquete'}
          </Button>
        </div>
      </div>
    </div>
  )
}
