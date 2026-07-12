import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../ui/Modal'
import { Input, Select } from '../ui/Input'
import { Button } from '../ui/Button'
import { useStore } from '../../store/useStore'
import { User, CalendarDays, Receipt, ArrowRight, CheckCircle2 } from 'lucide-react'
import type { EventType } from '../../types'

interface QuickStartWizardProps {
  open: boolean
  onClose: () => void
}

const EVENT_TYPES: EventType[] = ['Boda', 'Cumpleaños', 'Empresa', 'Afterwork', 'Fiesta privada', 'Otro']

export function QuickStartWizard({ open, onClose }: QuickStartWizardProps) {
  const navigate = useNavigate()
  const addClient = useStore(s => s.addClient)
  const addEvent = useStore(s => s.addEvent)
  const addBudget = useStore(s => s.addBudget)

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estado del formulario unificado
  const [formData, setFormData] = useState({
    // Cliente
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientCompany: '',
    // Evento
    eventName: '',
    eventDate: new Date().toISOString().split('T')[0],
    eventType: 'Boda' as EventType,
    eventAttendees: 100,
  })

  // Progreso de pasos
  const steps = [
    { id: 1, name: 'Cliente', icon: User },
    { id: 2, name: 'Evento', icon: CalendarDays },
    { id: 3, name: 'Presupuesto', icon: Receipt },
  ]

  const resetAndClose = () => {
    setStep(1)
    setFormData({
      clientName: '', clientEmail: '', clientPhone: '', clientCompany: '',
      eventName: '', eventDate: new Date().toISOString().split('T')[0], eventType: 'Boda', eventAttendees: 100
    })
    onClose()
  }

  const handleNext = () => {
    if (step === 1 && !formData.clientName.trim()) return
    if (step === 2 && !formData.eventName.trim()) return
    setStep(s => s + 1)
  }

  const handleBack = () => setStep(s => s - 1)

  const handleFinish = async () => {
    if (!formData.clientName.trim() || !formData.eventName.trim()) return
    setIsSubmitting(true)
    
    try {
      // 1. Crear Cliente
      const newClient = await addClient({
        name: formData.clientName,
        email: formData.clientEmail,
        phone: formData.clientPhone,
        company: formData.clientCompany,
        notes: 'Creado mediante Asistente Rápido'
      })
      const clientId = newClient.id

      // 2. Crear Evento asociado
      const newEvent = await addEvent({
        clientId,
        name: formData.eventName,
        date: formData.eventDate,
        type: formData.eventType,
        attendees: formData.eventAttendees,
        location: '',
        durationHours: 4,
        status: 'draft',
        acceptedBudgetId: null,
        notes: ''
      })
      const eventId = newEvent.id

      // 3. Crear Presupuesto vacío en borrador
      const newBudget = await addBudget({
        eventId,
        clientId,
        status: 'draft',
        packageId: null,
        items: [],
        directCosts: 0,
        partnerCosts: 0,
        laborCosts: 0,
        indirectCosts: 0,
        totalCost: 0,
        targetMarginPercentage: 30,
        recommendedPriceWithoutVAT: 0,
        recommendedPriceWithVAT: 0,
        offeredPriceWithoutVAT: 0,
        offeredPriceWithVAT: 0,
        vatPercentage: 21,
        expectedProfit: 0,
        expectedMarginPercentage: 0
      })
      const budgetId = newBudget.id

      resetAndClose()
      
      // Redirigir a la edición del presupuesto para que siga trabajando
      navigate(`/budgets/${budgetId}/edit`)
      
    } catch (error) {
      console.error("Error en el asistente:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      size="lg"
      title="Asistente de Nuevo Proyecto"
      description="Crea el cliente, el evento y su presupuesto en 3 sencillos pasos."
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            {steps.map((s) => (
              <div key={s.id} className="flex items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ring-2 ring-white ${
                  step === s.id ? 'bg-brand-600 text-white' : step > s.id ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {step > s.id ? <CheckCircle2 size={16} /> : s.id}
                </div>
                {s.id !== steps.length && (
                  <div className={`h-1 w-8 ${step > s.id ? 'bg-brand-100' : 'bg-slate-100'}`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="secondary" onClick={handleBack} disabled={isSubmitting}>Atrás</Button>
            )}
            {step < 3 ? (
              <Button onClick={handleNext} disabled={step === 1 && !formData.clientName.trim() || step === 2 && !formData.eventName.trim()}>
                Siguiente <ArrowRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button onClick={handleFinish} isLoading={isSubmitting}>
                <SparklesIcon className="mr-2" /> Crear y Editar Presupuesto
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="py-2">
        {step === 1 && (
          <div className="space-y-4 animate-fade-up">
            <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
              <User className="text-brand-500" /> Datos del Cliente
            </h3>
            <p className="text-sm text-slate-500 mb-6">¿A quién le vamos a facturar este evento?</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input 
                  label="Nombre del cliente o pareja *" 
                  placeholder="Ej. Ana y Carlos" 
                  value={formData.clientName}
                  onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                  autoFocus
                />
              </div>
              <Input 
                label="Teléfono" 
                placeholder="Ej. 600 123 456" 
                value={formData.clientPhone}
                onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
              />
              <Input 
                label="Email" 
                type="email"
                placeholder="Ej. ana@gmail.com" 
                value={formData.clientEmail}
                onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
              />
              <div className="sm:col-span-2">
                <Input 
                  label="Empresa (opcional)" 
                  placeholder="Si es un evento corporativo" 
                  value={formData.clientCompany}
                  onChange={(e) => setFormData({...formData, clientCompany: e.target.value})}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-up">
            <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
              <CalendarDays className="text-brand-500" /> Datos del Evento
            </h3>
            <p className="text-sm text-slate-500 mb-6">Detalles de la fiesta para {formData.clientName}.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input 
                  label="Nombre del evento *" 
                  placeholder="Ej. Boda Ana y Carlos" 
                  value={formData.eventName}
                  onChange={(e) => setFormData({...formData, eventName: e.target.value})}
                  autoFocus
                />
              </div>
              <Input 
                label="Fecha" 
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
              />
              <Select 
                label="Tipo de evento" 
                value={formData.eventType}
                onChange={(e) => setFormData({...formData, eventType: e.target.value as EventType})}
              >
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
              <div className="sm:col-span-2">
                <Input 
                  label="Número de asistentes estimado" 
                  type="number"
                  min={1}
                  value={formData.eventAttendees}
                  onChange={(e) => setFormData({...formData, eventAttendees: Number(e.target.value)})}
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fade-up text-center py-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Receipt size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-4">¡Todo listo para empezar!</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Al hacer clic en "Crear y Editar Presupuesto", guardaremos a <strong>{formData.clientName}</strong>, crearemos el evento <strong>{formData.eventName}</strong> para el <strong>{formData.eventDate}</strong> y te llevaremos a la hoja de presupuesto en blanco.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
      <path d="M20 3v4"/>
      <path d="M22 5h-4"/>
      <path d="M4 17v2"/>
      <path d="M5 18H3"/>
    </svg>
  )
}
