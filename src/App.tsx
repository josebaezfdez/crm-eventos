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
import InvoicesPage from './pages/InvoicesPage'
import PostEventPage from './pages/PostEventPage'
import SettingsPage from './pages/SettingsPage'
import HelpPage from './pages/HelpPage'
import PackageFormPage from './pages/PackageFormPage'
import BudgetPdfPreview from './pages/BudgetPdfPreview'

export default function App() {
  const isInitialized = useStore((s) => s.isInitialized)
  const initApp = useStore((s) => s.initApp)

  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    if (token && !isInitialized) {
      initApp()
    }
  }, [isInitialized, initApp, token])

  if (!token) {
    return <LoginPage />
  }

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        <p className="mt-4 text-sm font-medium animate-pulse">Conectando con el servidor...</p>
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
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/packages/new" element={<PackageFormPage />} />
        <Route path="/packages/:id/edit" element={<PackageFormPage />} />
        <Route path="/partners" element={<Navigate to="/settings?tab=partners" replace />} />
        <Route path="/packages" element={<Navigate to="/settings?tab=packages" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}
