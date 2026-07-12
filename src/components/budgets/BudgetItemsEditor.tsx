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
      <div className="overflow-x-auto">
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
