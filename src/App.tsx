import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useStore } from './store/useStore'
import { Loader2 } from 'lucide-react'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { useAuthStore } from './store/useAuthStore'
import DashboardPage from './pages/DashboardPage'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import BudgetWizardPage from './pages/BudgetWizardPage'
import BudgetViewPage from './pages/BudgetViewPage'
import BudgetsListPage from './pages/BudgetsListPage'
import ClientsPage from './pages/ClientsPage'
import PostEventPage from './pages/PostEventPage'
import SettingsPage from './pages/SettingsPage'
import HelpPage from './pages/HelpPage'
import PackageFormPage from './pages/PackageFormPage'
import BudgetPdfPreview from './pages/BudgetPdfPreview'
import PartnersPage from './pages/PartnersPage'
import PackagesPage from './pages/PackagesPage'

export default function App() {
  const isInitialized = useStore((s) => s.isInitialized)
  const initApp = useStore((s) => s.initApp)

  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    if (token && !isInitialized) {
      initApp()
    }
  }, [isInitialized, initApp, token])

  useEffect(() => {
    const handleUnauthorized = () => {
      useAuthStore.getState().logout()
      useStore.getState().resetApp()
    }
    window.addEventListener('auth-unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized)
  }, [])

  if (!token) {
    return <LoginPage />
  }

  const appError = useStore((s) => s.appError)

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        <p className="mt-4 text-sm font-medium animate-pulse">Conectando con el servidor...</p>
      </div>
    )
  }

  if (appError) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No se han podido cargar los datos</h3>
          <p className="mt-2 text-sm text-slate-500">{appError}</p>
          <button 
            onClick={() => initApp()}
            className="mt-6 inline-flex items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/events/:id/post-event" element={<PostEventPage />} />
        <Route path="/budgets" element={<BudgetsListPage />} />
        <Route path="/budgets/new" element={<BudgetWizardPage />} />
        <Route path="/budgets/:id/edit" element={<BudgetWizardPage />} />
        <Route path="/budgets/:id/pdf" element={<BudgetPdfPreview />} />
        <Route path="/budgets/:id" element={<BudgetViewPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/packages/new" element={<PackageFormPage />} />
        <Route path="/packages/:id/edit" element={<PackageFormPage />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/packages" element={<PackagesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}
