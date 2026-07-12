import { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardTitle, CardSubtitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { WizardStepper } from '../components/budgets/WizardStepper'
import { BudgetItemsEditor } from '../components/budgets/BudgetItemsEditor'
import { ScenarioTable } from '../components/budgets/ScenarioTable'
import { EventSelector } from '../components/budgets/EventSelector'
import { MarginAlert, MarginBar, MarginBadge } from '../components/ui/MarginBadge'
import { EmptyState } from '../components/ui/EmptyState'
import { useStore } from '../store/useStore'
import {
  buildBudgetSummary,
  buildScenarios,
  itemTotal,
} from '../utils/marginCalculator'
import { formatCurrency, formatPercent, uid } from '../utils/format'
import type { BudgetItem, BudgetItemCategory, Package } from '../types'
import {
  Package as PackageIcon, Receipt, Target,
  ArrowLeft, ArrowRight, Check, Sparkles, Plus, TrendingUp, Loader2
} from 'lucide-react'

const STEPS = [
  { title: 'Paquete', description: 'Elige base', icon: PackageIcon },
  { title: 'Líneas y Partners', description: 'Costes', icon: Receipt },
  { title: 'Rentabilidad', description: 'Precio y margen', icon: Target },
]

function packageItemsToBudgetItems(pkg: Package, partners: any[], duration: number): BudgetItem[] {
  const items: BudgetItem[] = []
  
  if (pkg.customItems) {
    pkg.customItems.forEach((pi) => {
      items.push({
        id: uid('bi'),
        name: pi.name,
        category: pi.category,
        quantity: pi.quantity,
        unitCost: pi.unitCost,
        totalCost: itemTotal(pi.quantity, pi.unitCost),
        unitPrice: pi.unitPrice || (pi.unitCost * 1.5),
        totalPrice: itemTotal(pi.quantity, pi.unitPrice || (pi.unitCost * 1.5)),
        isInternalCost: !pi.isVisibleToClient,
        isVisibleToClient: pi.isVisibleToClient,
      })
    })
  }

  if (pkg.partnerIds) {
    pkg.partnerIds.forEach((pid) => {
      const partner = partners.find(p => p.id === pid)
      if (partner) {
        const cost = partner.pricingType === 'fixed' ? partner.fixedRate : partner.hourlyRate * duration
        items.push({
          id: uid('bi'), name: partner.name, category: 'Partner',
          quantity: 1, unitCost: cost, totalCost: cost,
          unitPrice: cost * 1.5,
          totalPrice: cost * 1.5,
          isInternalCost: false, isVisibleToClient: true,
        })
      }
    })
  }

  return items
}

export default function BudgetWizardPage() {
  const navigate = useNavigate()
  const { id: budgetIdToEdit } = useParams()
  const [searchParams] = useSearchParams()
  const budgets = useStore((s) => s.budgets)
  const packages = useStore((s) => s.packages)
  const partners = useStore((s) => s.partners)
  const events = useStore((s) => s.events)
  const addBudget = useStore((s) => s.addBudget)
  const updateBudget = useStore((s) => s.updateBudget)

  const existingBudget = budgets.find((b) => b.id === budgetIdToEdit)
  const existingEventId = searchParams.get('eventId') || existingBudget?.eventId

  const existingEvent = events.find((e) => e.id === existingEventId)

  const [step, setStep] = useState(0)
  const [maxReached, setMaxReached] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const [packageId, setPackageId] = useState<string>('')
  const [items, setItems] = useState<BudgetItem[]>([])

  const [targetMargin, setTargetMargin] = useState<number>(40)
  const [vat, setVat] = useState<number>(21)

  useEffect(() => {
    if (existingBudget && !isInitialized) {
      setPackageId(existingBudget.packageId || '')
      setItems(existingBudget.items)
      setTargetMargin(existingBudget.targetMarginPercentage)
      setVat(existingBudget.vatPercentage)
      setIsInitialized(true)
      // Opcional: si ya hay presupuesto, podríamos arrancar en el paso 1 en vez del 0
      // goTo(1) 
    } else if (!existingBudget && !isInitialized) {
      setIsInitialized(true)
    }
  }, [existingBudget, isInitialized])

  const duration = existingEvent?.durationHours ?? 3

  const summary = useMemo(
    () => buildBudgetSummary({
      items, targetMarginPercentage: targetMargin, vatPercentage: vat,
    }),
    [items, targetMargin, vat],
  )

  const scenarios = useMemo(
    () => buildScenarios({
      totalCost: summary.totalCost, offeredPriceWithVAT: summary.offeredPriceWithVAT,
      recommendedPriceWithVAT: summary.recommendedPriceWithVAT, vatPercentage: vat, targetMargin, items,
    }),
    [summary, vat, targetMargin, items],
  )

  const goTo = (i: number) => { setStep(i); setMaxReached((m) => Math.max(m, i)) }

  // Si no hay evento en la URL, mostramos el selector
  if (!existingEventId) {
    return <EventSelector onSelect={(id) => navigate(`/budgets/new?eventId=${id}`, { replace: true })} />
  }

  if (!existingEvent) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <p className="text-sm font-medium text-slate-900">El evento no existe.</p>
        <Button className="mt-4" onClick={() => navigate('/events')}>Volver a eventos</Button>
      </div>
    )
  }
  const next = () => goTo(Math.min(STEPS.length - 1, step + 1))
  const back = () => goTo(Math.max(0, step - 1))

  const selectPackage = (id: string) => {
    setPackageId(id)
    const pkg = packages.find((p) => p.id === id)
    if (pkg) {
      setItems(packageItemsToBudgetItems(pkg, partners, duration))
      setTargetMargin(pkg.marginTarget)
    } else {
      setItems([])
    }
  }

  const addPartnerToItems = (partnerId: string) => {
    const partner = partners.find((p) => p.id === partnerId)
    if (!partner) return
    const cost = partner.pricingType === 'fixed' ? partner.fixedRate : partner.hourlyRate * duration
    if (items.some((it) => it.name === partner.name && it.category === 'Partner')) return
    
    // Sugerimos un precio de venta (por ejemplo, sumando el margen objetivo global o un 20%)
    const suggestedPrice = cost / (1 - targetMargin / 100)
    
    setItems([
      ...items,
      {
        id: uid('bi'), name: partner.name, category: 'Partner' as BudgetItemCategory,
        quantity: 1, unitCost: cost, totalCost: cost, 
        unitPrice: suggestedPrice, totalPrice: suggestedPrice, 
        isInternalCost: false, isVisibleToClient: true,
      },
    ])
  }

  const canSave = items.length > 0 && summary.offeredPriceWithVAT > 0

  const save = async () => {
    if (!canSave || !existingEvent) return
    setIsSaving(true)
    try {
      if (existingBudget) {
        await updateBudget(existingBudget.id, {
          packageId: packageId || null, items,
          directCosts: summary.directCosts, partnerCosts: summary.partnerCosts,
          laborCosts: summary.laborCosts, indirectCosts: summary.indirectCosts,
          totalCost: summary.totalCost, targetMarginPercentage: targetMargin,
          recommendedPriceWithoutVAT: summary.recommendedPriceWithoutVAT,
          recommendedPriceWithVAT: summary.recommendedPriceWithVAT,
          offeredPriceWithoutVAT: summary.offeredPriceWithoutVAT,
          offeredPriceWithVAT: summary.offeredPriceWithVAT, vatPercentage: vat,
          expectedProfit: summary.expectedProfit, expectedMarginPercentage: summary.expectedMarginPercentage,
        })
        navigate(`/budgets/${existingBudget.id}`)
      } else {
        const budget = await addBudget({
          eventId: existingEvent.id, clientId: existingEvent.clientId, packageId: packageId || null, items,
          directCosts: summary.directCosts, partnerCosts: summary.partnerCosts,
          laborCosts: summary.laborCosts, indirectCosts: summary.indirectCosts,
          totalCost: summary.totalCost, targetMarginPercentage: targetMargin,
          recommendedPriceWithoutVAT: summary.recommendedPriceWithoutVAT,
          recommendedPriceWithVAT: summary.recommendedPriceWithVAT,
          offeredPriceWithoutVAT: summary.offeredPriceWithoutVAT,
          offeredPriceWithVAT: summary.offeredPriceWithVAT, vatPercentage: vat,
          expectedProfit: summary.expectedProfit, expectedMarginPercentage: summary.expectedMarginPercentage,
          status: 'draft',
        })
        navigate(`/budgets/${budget.id}`)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const StepIcon = STEPS[step].icon

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Asistente"
        title={existingBudget ? "Editar presupuesto" : "Crear presupuesto"}
        description={`Para el evento: ${existingEvent.name}`}
        actions={<Link to={existingBudget ? `/budgets/${existingBudget.id}` : `/events/${existingEvent.id}`}><Button variant="ghost" size="sm">Cancelar</Button></Link>}
      />

      <WizardStepper steps={STEPS} current={step} maxReached={maxReached} onStepClick={goTo} />

      {/* STEP 1: Paquete */}
      {step === 0 && (
        <Card>
          <StepHeader icon={<StepIcon size={16} />} title="Paso 1 · Elige un paquete" subtitle="Partimos de un paquete base y luego lo ajustas a tu gusto." />
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {packages.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPackage(p.id)}
                className={`group rounded-2xl border p-4 text-left transition-all ${
                  packageId === p.id
                    ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-200'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-cardHover'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${packageId === p.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                    <Check size={12} strokeWidth={3} />
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{p.description}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Coste base <span className="tnum">{formatCurrency(p.baseCost)}</span></span>
                  <span className="tnum font-semibold text-brand-600">{formatCurrency(p.recommendedPrice)}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">Margen objetivo {p.marginTarget}% · {p.baseHours}h</p>
              </button>
            ))}
            <button
              onClick={() => selectPackage('')}
              className={`rounded-2xl border border-dashed p-4 text-left transition-all ${
                packageId === '' ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-200' : 'border-slate-300 bg-white hover:border-brand-300'
              }`}
            >
              <p className="flex items-center gap-2 font-semibold text-slate-900"><Sparkles size={15} className="text-accent-500" /> Presupuesto personalizado</p>
              <p className="mt-1 text-xs text-slate-500">Empieza desde cero y añade tus propias líneas.</p>
            </button>
          </div>
          <StepFooter onBack={back} onNext={next} />
        </Card>
      )}

      {/* STEP 2: Costes y Partners */}
      {step === 1 && (
        <Card>
          <StepHeader icon={<StepIcon size={16} />} title="Paso 2 · Líneas de Coste y Partners" subtitle="Edita las líneas precargadas o añade partners adicionales para el evento." />
          
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 mb-6">
            {partners.map((p) => {
              const cost = p.pricingType === 'fixed' ? p.fixedRate : p.hourlyRate * duration
              const added = items.some((it) => it.name === p.name && it.category === 'Partner')
              return (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 transition-colors hover:border-slate-300">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-400">
                      {p.category} ·{' '}
                      {p.pricingType === 'fixed'
                        ? `${formatCurrency(p.fixedRate)} / evento`
                        : `${formatCurrency(p.hourlyRate)} / h · ${duration}h = ${formatCurrency(cost)}`}
                    </p>
                  </div>
                  <Button size="sm" variant={added ? 'secondary' : 'primary'} disabled={added} onClick={() => addPartnerToItems(p.id)}>
                    {added ? <><Check size={14} /> Añadido</> : <><Plus size={14} /> Añadir</>}
                  </Button>
                </div>
              )
            })}
          </div>

          <CardSubtitle className="mb-3">Desglose de Líneas de Coste y Venta</CardSubtitle>
          {items.length === 0 ? (
            <EmptyState title="Sin líneas" description="Añade líneas o partners manualmente." icon={<Receipt size={22} />} />
          ) : (
            <div className="mt-2"><BudgetItemsEditor items={items} onChange={setItems} /></div>
          )}
          <StepFooter onBack={back} onNext={next} nextDisabled={items.length === 0} />
        </Card>
      )}

      {/* STEP 3: Rentabilidad */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <StepHeader icon={<StepIcon size={16} />} title="Paso 4 · Rentabilidad final" subtitle="Revisa el margen global tras haber definido los precios línea por línea." />
              <MarginBadge margin={summary.expectedMarginPercentage} />
            </div>
            <div className="mt-4"><MarginAlert margin={summary.expectedMarginPercentage} /></div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Margen objetivo deseado (%)" type="number" min={0} max={100} value={targetMargin} onChange={(e) => setTargetMargin(Number(e.target.value))} />
              <Input label="IVA (%)" type="number" min={0} value={vat} onChange={(e) => setVat(Number(e.target.value))} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <BigStat icon={<Receipt size={15} />} label="Coste total" value={formatCurrency(summary.totalCost)} />
              <BigStat icon={<Target size={15} />} label="Venta total" value={formatCurrency(summary.offeredPriceWithVAT)} sub="con IVA" />
              <BigStat icon={<TrendingUp size={15} />} label="Beneficio esperado" value={formatCurrency(summary.expectedProfit)} accent={summary.expectedProfit >= 0 ? 'green' : 'red'} />
              <BigStat icon={<Target size={15} />} label="Margen esperado" value={formatPercent(summary.expectedMarginPercentage)} accent={summary.expectedMarginPercentage >= 35 ? 'green' : summary.expectedMarginPercentage >= 20 ? 'amber' : 'red'} />
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><Target size={13} /> Margen vs objetivo ({targetMargin}%)</span>
                <span className="font-semibold text-slate-700">{formatPercent(summary.expectedMarginPercentage)}</span>
              </div>
              <MarginBar margin={summary.expectedMarginPercentage} target={targetMargin} />
            </div>
            {summary.expectedMarginPercentage < targetMargin && (
              <p className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 ring-1 ring-inset ring-amber-100">
                El margen obtenido ({formatPercent(summary.expectedMarginPercentage)}) es inferior al objetivo. Deberías subir los precios de venta en el paso anterior.
              </p>
            )}
          </Card>

          <Card>
            <div className="mb-3 flex items-center gap-2"><Sparkles size={16} className="text-accent-500" /><CardTitle>Simulador de escenarios</CardTitle></div>
            <CardSubtitle className="mb-3">Compara opciones basadas en el precio actual.</CardSubtitle>
            <ScenarioTable scenarios={scenarios} />
          </Card>

          <div className="flex flex-col gap-3 max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:z-50 max-sm:bg-white max-sm:p-4 max-sm:shadow-[0_-4px_16px_rgba(0,0,0,0.05)] sm:flex-row sm:justify-between">
            <Button className="max-sm:hidden" variant="secondary" onClick={back}><ArrowLeft size={15} /> Atrás</Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-2">
              <Link className="w-full sm:w-auto" to={existingBudget ? `/budgets/${existingBudget.id}` : `/events/${existingEvent.id}`}>
                <Button className="w-full" variant="ghost">Cancelar</Button>
              </Link>
              <Button className="w-full sm:w-auto" onClick={save} disabled={!canSave || isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                {existingBudget ? 'Actualizar Presupuesto' : 'Guardar Presupuesto'}
              </Button>
            </div>
          </div>
          {!canSave && (
            <p className="text-right text-xs text-amber-600 pb-20 sm:pb-0">
              Revisa que haya líneas de coste y un precio ofertado antes de guardar.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function StepHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="icon-chip-brand">{icon}</span>
      <div>
        <CardTitle>{title}</CardTitle>
        <CardSubtitle>{subtitle}</CardSubtitle>
      </div>
    </div>
  )
}

function StepFooter({ onBack, onNext, nextDisabled }: { onBack: () => void; onNext: () => void; nextDisabled?: boolean }) {
  return (
    <div className="mt-6 flex justify-between gap-3 max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:z-50 max-sm:bg-white max-sm:p-4 max-sm:shadow-[0_-4px_16px_rgba(0,0,0,0.05)] sm:border-t sm:border-slate-100 sm:pt-4">
      <Button className="w-full sm:w-auto" variant="secondary" onClick={onBack}><ArrowLeft size={15} /> Atrás</Button>
      <Button className="w-full sm:w-auto" onClick={onNext} disabled={nextDisabled}>Siguiente <ArrowRight size={15} /></Button>
    </div>
  )
}

function BigStat({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent?: 'green' | 'amber' | 'red' }) {
  const color = accent === 'green' ? 'text-emerald-600' : accent === 'amber' ? 'text-amber-600' : accent === 'red' ? 'text-red-600' : 'text-slate-900'
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">{icon}{label}</p>
      <p className={`tnum mt-1.5 text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
    </div>
  )
}
