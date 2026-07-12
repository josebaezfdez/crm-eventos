import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBudget, useClient, useEvent } from '../hooks/useSelectors'
import { useStore as useAppStore } from '../store/useStore'
import { Button } from '../components/ui/Button'
import { ArrowLeft, Printer, LayoutTemplate } from 'lucide-react'
import { TemplateClassic } from '../components/budgets/templates/TemplateClassic'
import { TemplateModern } from '../components/budgets/templates/TemplateModern'
import { TemplateBold } from '../components/budgets/templates/TemplateBold'

const DEFAULT_BUSINESS = {
  name: 'EventMargin',
  tagline: 'SaaS de Presupuestación',
  email: 'hola@eventmargin.com',
  phone: '+34 600 00 00 00',
}

type TemplateType = 'classic' | 'modern' | 'bold'

export default function BudgetPdfPreview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const budget = useBudget(id)
  const event = useEvent(budget?.eventId)
  const client = useClient(budget?.clientId)
  const settings = useAppStore((s) => s.settings)

  const business = {
    name: settings?.name || DEFAULT_BUSINESS.name,
    tagline: settings?.email ? '' : DEFAULT_BUSINESS.tagline,
    email: settings?.email || DEFAULT_BUSINESS.email,
    phone: settings?.phone || DEFAULT_BUSINESS.phone,
    logoUrl: settings?.logoUrl,
  }

  const [template, setTemplate] = useState<TemplateType>('classic')

  if (!budget) {
    return <div className="p-10 text-center">Presupuesto no encontrado</div>
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-slate-200/50 print:bg-white">
      {/* Topbar (No imprimible) */}
      <div className="no-print sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Volver
          </Button>
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <LayoutTemplate size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-700">Diseño:</span>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${template === 'classic' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setTemplate('classic')}
              >
                Clásico
              </button>
              <button
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${template === 'modern' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setTemplate('modern')}
              >
                Moderno
              </button>
              <button
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${template === 'bold' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setTemplate('bold')}
              >
                Bold
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden md:block">
            Sugerencia: Guarda como PDF usando la opción del navegador.
          </span>
          <Button onClick={handlePrint} className="w-full sm:w-auto">
            <Printer size={16} className="mr-2" />
            Imprimir / Guardar PDF
          </Button>
        </div>
      </div>

      {/* Área de Previsualización / Impresión */}
      <div className="p-4 sm:p-8 flex justify-center print:p-0 print:block">
        {/* Envoltorio simulando el papel A4 en pantalla */}
        <div className="bg-white shadow-xl max-w-[210mm] w-full mx-auto print:shadow-none print:max-w-none print:w-full print:mx-0">
          {template === 'classic' && (
            <TemplateClassic budget={budget} client={client} event={event} business={business} />
          )}
          {template === 'modern' && (
            <TemplateModern budget={budget} client={client} event={event} business={business} />
          )}
          {template === 'bold' && (
            <TemplateBold budget={budget} client={client} event={event} business={business} />
          )}
        </div>
      </div>
    </div>
  )
}
