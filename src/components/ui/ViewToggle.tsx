import { LayoutGrid, List } from 'lucide-react'
import type { ViewType } from '../../hooks/useViewPreference'

interface ViewToggleProps {
  view: ViewType
  onChange: (view: ViewType) => void
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
      <button
        onClick={() => onChange('list')}
        className={`flex h-7 w-8 items-center justify-center rounded-md transition-colors ${
          view === 'list' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
        }`}
        aria-label="Vista de listado"
        title="Vista de listado"
      >
        <List size={14} />
      </button>
      <button
        onClick={() => onChange('grid')}
        className={`flex h-7 w-8 items-center justify-center rounded-md transition-colors ${
          view === 'grid' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
        }`}
        aria-label="Vista de tarjetas"
        title="Vista de tarjetas"
      >
        <LayoutGrid size={14} />
      </button>
    </div>
  )
}
