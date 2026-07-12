import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { FileText } from 'lucide-react'

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturas"
        description="Gestión de facturación y pagos de eventos."
      />

      <EmptyState
        title="Próximamente"
        description="El módulo de facturación está en desarrollo. Pronto podrás emitir y gestionar facturas desde aquí."
        icon={<FileText size={24} />}
      />
    </div>
  )
}
