import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Receipt,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { getImageUrl } from '../../utils/images'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const navItems: NavItem[] = [
  { to: '/', label: 'Cuadro de mando', icon: LayoutDashboard, end: true },
  { to: '/clients', label: 'Clientes', icon: Users },
  { to: '/events', label: 'Eventos', icon: CalendarDays },
  { to: '/budgets', label: 'Presupuestos', icon: Receipt },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const settings = useStore(s => s.settings)
  
  const logoUrl = getImageUrl(settings?.lightLogoUrl || '')
  const companyName = settings?.name || 'EventMargin'

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      {/* Logo Header (Exact h-14 to match topbar) */}
      <div className="flex h-14 shrink-0 items-center gap-3 px-4 border-b border-slate-800">
        {logoUrl ? (
          <img src={logoUrl} alt={companyName} className="h-8 max-w-[120px] object-contain" />
        ) : (
          <>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm ring-1 ring-white/10">
              <span className="text-lg font-accent tracking-widest mt-0.5">{companyName.charAt(0)}</span>
            </div>
            <div>
              <p className="text-[14px] font-display font-semibold leading-tight text-white tracking-wide truncate max-w-[160px]">{companyName}</p>
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Menú Principal</p>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-brand-500/10 text-brand-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

    </div>
  )
}
