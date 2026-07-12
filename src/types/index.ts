// ============================================================================
// EventMargin · Tipos del dominio
// ----------------------------------------------------------------------------
// Toda la capa de datos (mock + localStorage + futura API/Supabase) trabaja
// contra estos tipos. Mantenerlos estables facilita el swap del backend.
// ============================================================================

export type ID = string

export type EventType =
  | 'Boda'
  | 'Cumpleaños'
  | 'Empresa'
  | 'Afterwork'
  | 'Fiesta privada'
  | 'Otro'

export type EventStatus = 'draft' | 'quoted' | 'accepted' | 'rejected' | 'completed'

export type BudgetStatus = 'draft' | 'sent' | 'accepted' | 'rejected'

export type PaymentStatus = 'pending' | 'paid'

export type PartnerCategory =
  | 'DJ'
  | 'Fotógrafo'
  | 'Músico'
  | 'Fotomatón'
  | 'Camarero'
  | 'Técnico sonido'
  | 'Decoración'
  | 'Otro'

export type PartnerPricingType = 'hourly' | 'fixed'

export type BudgetItemCategory =
  | 'Bebida'
  | 'Comida'
  | 'Hielo'
  | 'Vasos'
  | 'Personal'
  | 'Transporte'
  | 'Alquiler'
  | 'Partner'
  | 'Decoración'
  | 'Otros'

// ----------------------------------------------------------------------------
// Entidades principales
// ----------------------------------------------------------------------------

export interface Client {
  id: ID
  name: string
  email: string
  phone: string
  company: string
  notes: string
  createdAt: string
}

export interface Company {
  id: string
  name: string
  taxId?: string
  address?: string
  email?: string
  phone?: string
  website?: string
  lightLogoUrl?: string
  darkLogoUrl?: string
  createdAt: string
}

export interface Partner {
  id: ID
  name: string
  category: PartnerCategory
  pricingType: PartnerPricingType
  hourlyRate: number
  fixedRate: number
  notes: string
  phone: string
  email: string
  createdAt: string
}

export interface PackageItem {
  name: string
  category: BudgetItemCategory
  quantity: number
  unitCost: number
  unitPrice: number
  isVisibleToClient: boolean
}

export interface Package {
  id: ID
  name: string
  description: string
  baseHours: number
  baseCost: number
  recommendedPrice: number
  partnerIds: string[]
  customItems: PackageItem[]
  marginTarget: number
  createdAt: string
}

export interface Event {
  id: ID
  clientId: ID
  name: string
  date: string
  location: string
  type: EventType
  attendees: number
  durationHours: number
  status: EventStatus
  acceptedBudgetId: ID | null
  notes: string
  createdAt: string
}

export interface BudgetItem {
  id: ID
  name: string
  category: BudgetItemCategory
  quantity: number
  unitCost: number
  totalCost: number
  unitPrice: number
  totalPrice: number
  isInternalCost: boolean
  isVisibleToClient: boolean
}

export interface Budget {
  id: ID
  eventId: ID
  clientId: ID
  packageId: ID | null
  items: BudgetItem[]
  directCosts: number
  partnerCosts: number
  laborCosts: number
  indirectCosts: number
  totalCost: number
  targetMarginPercentage: number
  recommendedPriceWithoutVAT: number
  recommendedPriceWithVAT: number
  offeredPriceWithoutVAT: number
  offeredPriceWithVAT: number
  vatPercentage: number
  expectedProfit: number
  expectedMarginPercentage: number
  status: BudgetStatus
  createdAt: string
}

export interface Payment {
  id: ID
  eventId: ID
  amount: number
  dueDate: string
  status: PaymentStatus
  concept: string
}

// ----------------------------------------------------------------------------
// Resultado post-evento (comparación previsto vs real)
// ----------------------------------------------------------------------------

export interface RealCostLine {
  category: BudgetItemCategory
  budgeted: number
  real: number
}

export interface PostEventResult {
  eventId: ID
  chargedPrice: number
  realCostLines: RealCostLine[]
  realTotalCost: number
  notes: string
  savedAt: string
}

// ----------------------------------------------------------------------------
// Métricas y simulación
// ----------------------------------------------------------------------------

export interface DashboardMetrics {
  estimatedBillingMonth: number
  estimatedProfitMonth: number
  averageMargin: number
  confirmedEvents: number
  pendingBudgets: number
  acceptedBudgets: number
  pendingMoney: number
}

export type MarginLevel = 'danger' | 'warning' | 'ok' | 'excellent' | 'loss'

export interface MarginAssessment {
  level: MarginLevel
  label: string
  message: string
  color: string
}

export interface ScenarioResult {
  key: string
  label: string
  description: string
  finalPrice: number
  totalCost: number
  profit: number
  margin: number
  recommendation: string
}

export interface MarginSimulation {
  offered: number
  recommended: number
  premium: number
  scenarios: ScenarioResult[]
}
