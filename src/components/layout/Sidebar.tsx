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

import { useAuthStore } from '../../store/useAuthStore'
import { ChevronDown, Loader2 } from 'lucide-react'
import { useState } from 'react'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const settings = useStore(s => s.settings)
  const location = useLocation()
  const { memberships, user, switchWorkspace } = useAuthStore()
  const [isSwitching, setIsSwitching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  
  const logoUrl = getImageUrl(settings?.lightLogoUrl || '')
  const companyName = settings?.name || 'EventMargin'

  const handleSwitch = async (companyId: string) => {
    if (companyId === user?.companyId) return
    setIsOpen(false)
    setIsSwitching(true)
    try {
      await switchWorkspace(companyId)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSwitching(false)
    }
  }

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300 relative">
      {/* Workspace Selector */}
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex h-14 shrink-0 items-center justify-between gap-3 px-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="h-8 max-w-[120px] object-contain" />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm ring-1 ring-white/10">
                <span className="text-lg tracking-widest mt-0.5">{companyName.charAt(0)}</span>
              </div>
            )}
            <div className="flex-1 truncate">
              <p className="text-[14px] font-semibold leading-tight text-white tracking-wide truncate">{companyName}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Workspace</p>
            </div>
          </div>
          {isSwitching ? (
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute top-14 left-2 right-2 mt-1 z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden py-1">
              <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-700">Cambiar Workspace</p>
              {memberships.map(m => {
                const isActive = m.companyId === user?.companyId
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSwitch(m.companyId)}
                    className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between ${isActive ? 'bg-brand-500/10 text-brand-400 font-medium' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                  >
                    <span className="truncate">{m.companyId === user?.companyId ? companyName : `Workspace ${m.companyId.substring(0,8)}`}</span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />}
                  </button>
                )
              })}
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
