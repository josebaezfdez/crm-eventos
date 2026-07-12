import { useState, useRef, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Menu, X, Settings, LogOut, HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const user = useAuthStore(s => s.user)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 lg:block">
        <Sidebar />
      </aside>

      {/* Sidebar mobile (drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative flex w-64 max-w-[80%] flex-col bg-slate-900 shadow-2xl animate-[slide-in-left_0.3s_ease-out]">
            <div className="absolute right-0 top-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setMobileOpen(false)}
              >
                <span className="sr-only">Cerrar menú</span>
                <X className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Contenido */}
      <div className="lg:pl-64">
        {/* Topbar (h-14 exactly matching Sidebar header) */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 -ml-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <div className="flex flex-1 items-center gap-2">
            {/* The breadcrumbs are removed or simplified to standard CRM */}
            <span className="text-[13px] font-semibold text-slate-700 sm:inline">EventMargin CRM</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
              <Link
                to="/help"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-brand-600 transition-colors"
                title="Centro de Ayuda"
                aria-label="Ayuda"
              >
                <HelpCircle size={20} />
              </Link>
            </div>
            
            {/* Dropdown de usuario */}
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[13px] font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200 focus:outline-none transition-colors"
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </button>
              
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden animate-[fade-in-down_0.2s_ease-out]">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'Usuario'}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email || 'admin@example.com'}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="group flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                    >
                      <Settings size={16} className="mr-3 text-slate-400 group-hover:text-brand-500" />
                      Configuración
                    </Link>
                  </div>
                  <div className="border-t border-slate-100 py-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        window.dispatchEvent(new Event('auth-unauthorized'))
                      }}
                      className="group flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600"
                    >
                      <LogOut size={16} className="mr-3 text-slate-400 group-hover:text-red-500" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
