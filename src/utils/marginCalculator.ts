// ============================================================================
// EventMargin · Lógica de cálculo de rentabilidad
// ----------------------------------------------------------------------------
// Toda la matemática del producto vive aquí. Aislarla permite:
//  - testearla sin UI.
//  - reutilizarla en el wizard, el dashboard y la vista post-evento.
//  - mantener un único lugar de verdad para las fórmulas de margen.
// ============================================================================

import type {
  Budget,
  BudgetItem,
  BudgetItemCategory,
  MarginAssessment,
  MarginLevel,
  MarginSimulation,
  ScenarioResult,
} from '../types'

// Categorías que se contabilizan en cada bloque de coste.
// El total de los 4 bloques siempre coincide con la suma de items.
const DIRECT_CATEGORIES: BudgetItemCategory[] = [
  'Bebida',
  'Comida',
  'Hielo',
  'Vasos',
  'Decoración',
  'Alquiler',
  'Otros',
]
const LABOR_CATEGORIES: BudgetItemCategory[] = ['Personal']
const PARTNER_CATEGORIES: BudgetItemCategory[] = ['Partner']
const INDIRECT_CATEGORIES: BudgetItemCategory[] = ['Transporte']

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function itemTotal(quantity: number, unitCost: number): number {
  return round2(quantity * unitCost)
}

export function sumItems(items: BudgetItem[]): number {
  return round2(items.reduce((acc, it) => acc + it.totalCost, 0))
}

export function costBuckets(items: BudgetItem[]): {
  directCosts: number
  partnerCosts: number
  laborCosts: number
  indirectCosts: number
  totalCost: number
} {
  let directCosts = 0
  let partnerCosts = 0
  let laborCosts = 0
  let indirectCosts = 0
  for (const it of items) {
    if (PARTNER_CATEGORIES.includes(it.category)) partnerCosts += it.totalCost
    else if (LABOR_CATEGORIES.includes(it.category)) laborCosts += it.totalCost
    else if (INDIRECT_CATEGORIES.includes(it.category)) indirectCosts += it.totalCost
    else if (DIRECT_CATEGORIES.includes(it.category)) directCosts += it.totalCost
    else directCosts += it.totalCost
  }
  const totalCost = round2(directCosts + partnerCosts + laborCosts + indirectCosts)
  return {
    directCosts: round2(directCosts),
    partnerCosts: round2(partnerCosts),
    laborCosts: round2(laborCosts),
    indirectCosts: round2(indirectCosts),
    totalCost,
  }
}

/**
 * Precio mínimo recomendado sin IVA para alcanzar el margen objetivo.
 *   recommendedPriceWithoutVAT = totalCost / (1 - targetMargin/100)
 */
export function recommendedPriceWithoutVAT(totalCost: number, targetMargin: number): number {
  if (targetMargin >= 100) return 0
  return round2(totalCost / (1 - targetMargin / 100))
}

export function addVAT(priceWithoutVAT: number, vat: number): number {
  return round2(priceWithoutVAT * (1 + vat / 100))
}

export function vatFromTotal(priceWithVAT: number, vat: number): number {
  return round2(priceWithVAT / (1 + vat / 100))
}

export function expectedProfit(offeredWithoutVAT: number, totalCost: number): number {
  return round2(offeredWithoutVAT - totalCost)
}

export function expectedMargin(offeredWithoutVAT: number, totalCost: number): number {
  if (offeredWithoutVAT === 0) return 0
  return round2(((offeredWithoutVAT - totalCost) / offeredWithoutVAT) * 100)
}

// ----------------------------------------------------------------------------
// Alertas de rentabilidad
// ----------------------------------------------------------------------------
export function assessMargin(margin: number): MarginAssessment {
  if (margin < 0) {
    return {
      level: 'loss',
      label: 'Pérdida',
      message: 'Estás presupuestando por debajo de costes reales estimados.',
      color: 'red',
    }
  }
  if (margin < 20) {
    return {
      level: 'danger',
      label: 'Evento no recomendable',
      message: 'Este evento no parece rentable con el precio actual.',
      color: 'red',
    }
  }
  if (margin < 35) {
    return {
      level: 'warning',
      label: 'Margen ajustado',
      message: 'El margen es justo. Cuidado con imprevistos u horas extra.',
      color: 'amber',
    }
  }
  if (margin < 50) {
    return {
      level: 'ok',
      label: 'Evento rentable',
      message: 'Buen margen. Este evento es recomendable.',
      color: 'green',
    }
  }
  return {
    level: 'excellent',
    label: 'Margen excelente',
    message: 'Excelente margen. Evento muy recomendable.',
    color: 'blue',
  }
}

export function sumItemPrices(items: BudgetItem[]): number {
  return round2(items.reduce((acc, it) => acc + (it.totalPrice || 0), 0))
}

// ----------------------------------------------------------------------------
// Construcción de un presupuesto a partir de items + parámetros
// ----------------------------------------------------------------------------
export interface BuildBudgetInput {
  items: BudgetItem[]
  targetMarginPercentage: number
  vatPercentage: number
}

export function buildBudgetSummary(input: BuildBudgetInput) {
  const buckets = costBuckets(input.items)
  const recWithoutVAT = recommendedPriceWithoutVAT(buckets.totalCost, input.targetMarginPercentage)
  const recWithVAT = addVAT(recWithoutVAT, input.vatPercentage)
  
  const offeredWithoutVAT = sumItemPrices(input.items)
  const offeredPriceWithVAT = addVAT(offeredWithoutVAT, input.vatPercentage)
  
  const profit = expectedProfit(offeredWithoutVAT, buckets.totalCost)
  const margin = expectedMargin(offeredWithoutVAT, buckets.totalCost)
  
  return {
    ...buckets,
    recommendedPriceWithoutVAT: recWithoutVAT,
    recommendedPriceWithVAT: recWithVAT,
    offeredPriceWithoutVAT: offeredWithoutVAT,
    offeredPriceWithVAT: offeredPriceWithVAT,
    expectedProfit: profit,
    expectedMarginPercentage: margin,
  }
}

// ----------------------------------------------------------------------------
// Simulador de escenarios
// ----------------------------------------------------------------------------
export interface SimulationInput {
  totalCost: number
  offeredPriceWithVAT: number
  recommendedPriceWithVAT: number
  vatPercentage: number
  targetMargin: number
  items: BudgetItem[]
}

export function buildScenarios(input: SimulationInput): ScenarioResult[] {
  const {
    totalCost,
    offeredPriceWithVAT,
    recommendedPriceWithVAT,
    vatPercentage,
    items,
  } = input

  const make = (
    key: string,
    label: string,
    description: string,
    newCost: number,
    newPriceWithVAT: number,
    recommendation: string,
  ): ScenarioResult => {
    const priceWithoutVAT = vatFromTotal(newPriceWithVAT, vatPercentage)
    const profit = expectedProfit(priceWithoutVAT, newCost)
    const margin = expectedMargin(priceWithoutVAT, newCost)
    return {
      key,
      label,
      description,
      finalPrice: round2(newPriceWithVAT),
      totalCost: round2(newCost),
      profit,
      margin,
      recommendation,
    }
  }

  const partnerItems = items.filter((it) => it.category === 'Partner')
  const partnerCost = round2(partnerItems.reduce((acc, it) => acc + it.totalCost, 0))
  const costWithoutPartners = round2(totalCost - partnerCost)

  const cheapestPartner = partnerItems
    .slice()
    .sort((a, b) => a.totalCost - b.totalCost)[0]
  const costWithoutCheapestPartner = cheapestPartner
    ? round2(totalCost - cheapestPartner.totalCost)
    : totalCost

  const scenarios: ScenarioResult[] = []

  scenarios.push(
    make(
      'current',
      'Precio ofrecido actual',
      'Tu precio de venta actual.',
      totalCost,
      offeredPriceWithVAT,
      recommendForMargin(assessMargin(expectedMargin(vatFromTotal(offeredPriceWithVAT, vatPercentage), totalCost)).level),
    ),
  )

  scenarios.push(
    make(
      'recommended',
      'Precio mínimo recomendado',
      'Precio para alcanzar el margen objetivo sin primar el valor percibido.',
      totalCost,
      recommendedPriceWithVAT,
      'Precio que asegura el margen objetivo. Es el suelo recomendado para no perder dinero.',
    ),
  )

  scenarios.push(
    make(
      'premium',
      'Precio premium (+15% sobre recomendado)',
      'Si el cliente valora marca y experiencia, puedes posicionar por encima.',
      totalCost,
      round2(recommendedPriceWithVAT * 1.15),
      'Recomendado si el cliente valora marca, experiencia o exclusividad.',
    ),
  )

  if (partnerItems.length > 0) {
    scenarios.push(
      make(
        'remove-cheapest-partner',
        'Eliminar partner más barato',
        'Quita el partner más económico para mejorar margen, asumiendo menos servicios.',
        costWithoutCheapestPartner,
        offeredPriceWithVAT,
        'Reducir este partner mejora el margen, pero puede afectar al valor percibido.',
      ),
    )
    scenarios.push(
      make(
        'remove-all-partners',
        'Eliminar todos los partners',
        'Escenario sin partners externos: tú asumes todo el servicio.',
        costWithoutPartners,
        offeredPriceWithVAT,
        'Mayor margen si puedes asumir el servicio, pero más carga operativa.',
      ),
    )
  }

  for (const bump of [10, 20, 30]) {
    scenarios.push(
      make(
        `bump-${bump}`,
        `Subir precio +${bump}%`,
        `Mismo coste, subes el precio un ${bump}%.`,
        totalCost,
        round2(offeredPriceWithVAT * (1 + bump / 100)),
        bump >= 20
          ? 'Subida sana que acerca el precio al mínimo recomendado.'
          : 'Mejora el margen sin alejarte mucho del precio actual.',
      ),
    )
  }

  return scenarios
}

function recommendForMargin(level: MarginLevel): string {
  switch (level) {
    case 'loss':
      return 'No recomendable: pierdes dinero. Sube el precio o reduce costes.'
    case 'danger':
      return 'Evento no recomendable con el precio actual.'
    case 'warning':
      return 'Margen ajustado. Cuidado con imprevistos.'
    case 'ok':
      return 'Buen margen. Evento recomendable.'
    case 'excellent':
      return 'Margen excelente. Evento muy recomendable.'
  }
}

export function buildSimulation(input: SimulationInput): MarginSimulation {
  const scenarios = buildScenarios(input)
  const offered = vatFromTotal(input.offeredPriceWithVAT, input.vatPercentage)
  const recommended = vatFromTotal(input.recommendedPriceWithVAT, input.vatPercentage)
  const premium = round2(recommended * 1.15)
  return { offered, recommended, premium, scenarios }
}

// ----------------------------------------------------------------------------
// Métricas de dashboard (resumen)
// ----------------------------------------------------------------------------
export function averageMargin(margins: number[]): number {
  if (margins.length === 0) return 0
  return round2(margins.reduce((a, b) => a + b, 0) / margins.length)
}

export function minPriceToReachTarget(totalCost: number, targetMargin: number): number {
  return recommendedPriceWithoutVAT(totalCost, targetMargin)
}

// Devuelve cuánto % debería subir el precio actual para alcanzar el margen objetivo.
export function priceIncreaseToReachTarget(
  currentPriceWithVAT: number,
  totalCost: number,
  targetMargin: number,
  vat: number,
): number {
  const currentWithoutVAT = vatFromTotal(currentPriceWithVAT, vat)
  const target = recommendedPriceWithoutVAT(totalCost, targetMargin)
  if (currentWithoutVAT === 0) return 0
  return round2(((target - currentWithoutVAT) / currentWithoutVAT) * 100)
}

// Helper para recalcular un presupuesto completo (útil al editar items).
export function recalcBudget(b: Budget): Budget {
  const summary = buildBudgetSummary({
    items: b.items,
    targetMarginPercentage: b.targetMarginPercentage,
    vatPercentage: b.vatPercentage,
  })
  return {
    ...b,
    ...summary,
  }
}
