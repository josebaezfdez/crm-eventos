import { Button } from '../ui/Button'
import { formatCurrency } from '../../utils/format'
import { Plus, X } from 'lucide-react'
import { itemTotal } from '../../utils/marginCalculator'
import type { BudgetItem, BudgetItemCategory } from '../../types'
import { uid } from '../../utils/format'

const CATEGORIES: BudgetItemCategory[] = [
  'Bebida',
  'Comida',
  'Hielo',
  'Vasos',
  'Personal',
  'Transporte',
  'Alquiler',
  'Partner',
  'Decoración',
  'Otros',
]

interface BudgetItemsEditorProps {
  items: BudgetItem[]
  onChange: (items: BudgetItem[]) => void
}

export function BudgetItemsEditor({ items, onChange }: BudgetItemsEditorProps) {
  const update = (id: string, patch: Partial<BudgetItem>) => {
    const next = items.map((it) => {
      if (it.id !== id) return it
      const merged = { ...it, ...patch }
      merged.totalCost = itemTotal(merged.quantity, merged.unitCost)
      merged.totalPrice = itemTotal(merged.quantity, merged.unitPrice || 0)
      return merged
    })
    onChange(next)
  }

  const remove = (id: string) => onChange(items.filter((it) => it.id !== id))

  const add = () => {
    onChange([
      ...items,
      {
        id: uid('bi'),
        name: 'Nueva línea',
        category: 'Otros',
        quantity: 1,
        unitCost: 0,
        totalCost: 0,
        unitPrice: 0,
        totalPrice: 0,
        isInternalCost: false,
        isVisibleToClient: true,
      },
    ])
  }

  const totalCost = items.reduce((acc, it) => acc + it.totalCost, 0)
  const totalPrice = items.reduce((acc, it) => acc + (it.totalPrice || 0), 0)

  return (
    <div className="space-y-3">
      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2 pr-3 font-medium">Categoría</th>
              <th className="py-2 pr-3 font-medium">Concepto</th>
              <th className="py-2 pr-3 text-right font-medium">Cant.</th>
              <th className="py-2 pr-3 text-right font-medium">Coste ud.</th>
              <th className="py-2 pr-3 text-right font-medium">Total Coste</th>
              <th className="py-2 pr-3 text-right font-medium">Precio ud.</th>
              <th className="py-2 pr-3 text-right font-medium">Total Venta</th>
              <th className="py-2 pr-3 text-center font-medium">Cliente</th>
              <th className="py-2 pr-3 text-center font-medium">Interno</th>
              <th className="py-2 pr-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-slate-50">
                <td className="py-2 pr-3">
                  <select
                    value={it.category}
                    onChange={(e) => update(it.id, { category: e.target.value as BudgetItemCategory })}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-3">
                  <input
                    value={it.name}
                    onChange={(e) => update(it.id, { name: e.target.value })}
                    className="w-full min-w-[140px] rounded-md border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={it.quantity}
                    onChange={(e) => update(it.id, { quantity: Number(e.target.value) })}
                    className="w-16 rounded-md border border-slate-200 px-2 py-1 text-right text-xs focus:outline-none"
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={it.unitCost}
                    onChange={(e) => update(it.id, { unitCost: Number(e.target.value) })}
                    className="w-20 rounded-md border border-slate-200 px-2 py-1 text-right text-xs focus:outline-none"
                  />
                </td>
                <td className="tnum py-2 pr-3 text-right font-medium text-slate-800">{formatCurrency(it.totalCost)}</td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={it.unitPrice || 0}
                    onChange={(e) => update(it.id, { unitPrice: Number(e.target.value) })}
                    className="w-20 rounded-md border border-brand-200 bg-brand-50/30 px-2 py-1 text-right text-xs focus:outline-none focus:border-brand-400"
                  />
                </td>
                <td className="tnum py-2 pr-3 text-right font-bold text-brand-700">{formatCurrency(it.totalPrice || 0)}</td>
                <td className="py-2 pr-3 text-center">
                  <input
                    type="checkbox"
                    checked={it.isVisibleToClient}
                    onChange={(e) => update(it.id, { isVisibleToClient: e.target.checked })}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-200"
                    title="Visible para el cliente"
                  />
                </td>
                <td className="py-2 pr-3 text-center">
                  <input
                    type="checkbox"
                    checked={it.isInternalCost}
                    onChange={(e) => update(it.id, { isInternalCost: e.target.checked })}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-200"
                    title="Coste interno (no se factura directamente)"
                  />
                </td>
                <td className="py-2 pr-2 text-right">
                  <button
                    onClick={() => remove(it.id)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Eliminar línea"
                  >
                    <X size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="block md:hidden space-y-4">
        {items.map((it) => (
          <div key={it.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative space-y-3">
             <button 
               onClick={() => remove(it.id)} 
               className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 rounded-md"
             >
                <X size={18} />
             </button>
             
             <div className="flex flex-col gap-3 pr-8">
                <div className="w-full space-y-1">
                   <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Concepto</label>
                   <input 
                     value={it.name} 
                     onChange={(e) => update(it.id, { name: e.target.value })} 
                     className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:bg-white" 
                   />
                </div>
                <div className="w-full space-y-1">
                   <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Categoría</label>
                   <select 
                     value={it.category} 
                     onChange={(e) => update(it.id, { category: e.target.value as BudgetItemCategory })} 
                     className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:bg-white"
                   >
                     {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="space-y-2 bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                   <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Costes</label>
                   <div className="flex items-center gap-2">
                     <input 
                       type="number" min={0} step="0.01" 
                       value={it.quantity} 
                       onChange={(e) => update(it.id, { quantity: Number(e.target.value) })} 
                       className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm text-right" 
                       placeholder="Cant." 
                     />
                     <span className="text-slate-400 font-medium">×</span>
                     <input 
                       type="number" min={0} step="0.01" 
                       value={it.unitCost} 
                       onChange={(e) => update(it.id, { unitCost: Number(e.target.value) })} 
                       className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm text-right" 
                       placeholder="Coste ud." 
                     />
                   </div>
                   <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                     <span className="text-xs text-slate-500">Total</span>
                     <span className="text-sm font-medium text-slate-700">{formatCurrency(it.totalCost)}</span>
                   </div>
                </div>

                <div className="space-y-2 bg-brand-50/50 p-3 rounded-lg border border-brand-100/50">
                   <label className="text-[10px] font-semibold text-brand-600 uppercase tracking-wider">Precio Venta</label>
                   <input 
                     type="number" min={0} step="0.01" 
                     value={it.unitPrice || 0} 
                     onChange={(e) => update(it.id, { unitPrice: Number(e.target.value) })} 
                     className="w-full rounded-md border border-brand-200 px-2 py-1.5 text-sm text-right bg-white focus:border-brand-400 focus:ring-1 focus:ring-brand-400" 
                     placeholder="Precio ud." 
                   />
                   <div className="flex justify-between items-center pt-1 border-t border-brand-200/60">
                     <span className="text-xs text-brand-600/70">Total</span>
                     <span className="text-sm font-bold text-brand-700">{formatCurrency(it.totalPrice || 0)}</span>
                   </div>
                </div>
             </div>
             
             <div className="flex items-center gap-6 pt-3 border-t border-slate-100 mt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                   <input 
                     type="checkbox" 
                     checked={it.isVisibleToClient} 
                     onChange={(e) => update(it.id, { isVisibleToClient: e.target.checked })} 
                     className="rounded border-slate-300 text-brand-600 focus:ring-brand-200 h-4 w-4" 
                   />
                   Mostrar al cliente
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                   <input 
                     type="checkbox" 
                     checked={it.isInternalCost} 
                     onChange={(e) => update(it.id, { isInternalCost: e.target.checked })} 
                     className="rounded border-slate-300 text-brand-600 focus:ring-brand-200 h-4 w-4" 
                   />
                   Coste interno
                </label>
             </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-start justify-between">
        <Button variant="secondary" size="sm" onClick={add}><Plus size={14} /> Añadir línea</Button>
        <div className="text-right">
          <p className="tnum text-xs text-slate-500">Total costes: {formatCurrency(totalCost)}</p>
          <p className="tnum text-sm font-bold text-slate-900 mt-1">Total venta (sin IVA): {formatCurrency(totalPrice)}</p>
        </div>
      </div>
    </div>
  )
}

// Re-export para uso puntual en formularios sueltos
export { CATEGORIES as BUDGET_ITEM_CATEGORIES }
export type { BudgetItemCategory }
