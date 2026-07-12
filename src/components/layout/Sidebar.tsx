import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Receipt,
  Package,
  Handshake,
  Building2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { getImageUrl } from '../../utils/images'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  search?: string
}

interface NavGroup {
  name: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    name: 'Operaciones',
    items: [
      { to: '/', label: 'Panel de control', icon: LayoutDashboard, end: true },
      { to: '/events', label: 'Eventos', icon: CalendarDays },
      { to: '/budgets', label: 'Presupuestos', icon: Receipt },
      { to: '/clients', label: 'Clientes', icon: Users },
    ],
  },
  {
    name: 'Catálogo',
    items: [
      { to: '/packages', label: 'Paquetes', icon: Package },
      { to: '/partners', label: 'Proveedores', icon: Handshake },
    ],
  },
  {
    name: 'Administración',
    items: [
      { to: '/settings', label: 'Empresa', icon: Building2 },
    ],
  },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const settings = useStore(s => s.settings)
  const location = useLocation()
  
  const logoUrl = getImageUrl(settings?.lightLogoUrl || '')
  const companyName = settings?.name || 'EventMargin'

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      <div className="flex h-14 shrink-0 items-center gap-3 px-4 border-b border-slate-800">
        {logoUrl ? (
          <img src={logoUrl} alt={companyName} className="h-8 max-w-[120px] object-contain" />
        ) : (
          <>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm ring-1 ring-white/10">
              <span className="text-lg tracking-widest mt-0.5">{companyName.charAt(0)}</span>
            </div>
            <div>
              <p className="text-[14px] font-semibold leading-tight text-white tracking-wide truncate max-w-[160px]">{companyName}</p>
            </div>
          </>
        )}
      </div>

      <nav className="flex-1 space-y-6 px-3 py-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.name} className="space-y-1">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{group.name}</p>
            {group.items.map((item) => {
              const Icon = item.icon
              // Check if active based on pathname AND search (query param) if provided
              const isActive = item.search 
                ? location.pathname === item.to && location.search === item.search
                : (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))

              return (
                <NavLink
                  key={item.to + (item.search || '')}
                  to={{ pathname: item.to, search: item.search }}
                  onClick={onNavigate}
                  className={`
                    group flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-all
                    ${isActive
                        ? 'bg-brand-500/10 text-brand-400'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }
                  `}
                >
                  <Icon
                    size={18}
                    className={isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {item.label}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>
    </div>
  )
}
