// ============================================================================
// EventMargin · Datos mock iniciales (demo "Malatesta", coctelería móvil)
// ----------------------------------------------------------------------------
// Estos datos solo se cargan la primera vez (o tras "Reiniciar datos").
// Después la app persiste en localStorage y el usuario puede editar/borrar.
// ============================================================================

import type {
  Budget,
  Client,
  Event,
  Package,
  Partner,
  Payment,
  PostEventResult,
} from '../types'

const now = '2026-06-01T10:00:00.000Z'

// ----------------------------------------------------------------------------
// Clientes
// ----------------------------------------------------------------------------
export const mockClients: Client[] = [
  {
    id: 'c1',
    name: 'Laura Méndez',
    email: 'laura@techfin.solutions',
    phone: '+34 611 22 33 44',
    company: 'TechFin Solutions',
    notes: 'Empresa local. Busca afterwork trimestral para el equipo (40 personas).',
    createdAt: '2026-05-10T09:00:00.000Z',
  },
  {
    id: 'c2',
    name: 'Carlos Ruiz & Marta Lozano',
    email: 'carlos.marta@email.com',
    phone: '+34 622 33 44 55',
    company: '',
    notes: 'Pareja. Boda íntima ~50 invitados. Sensibles al precio.',
    createdAt: '2026-05-12T11:30:00.000Z',
  },
  {
    id: 'c3',
    name: 'Javier Soler',
    email: 'javier.soler@email.com',
    phone: '+34 633 44 55 66',
    company: '',
    notes: 'Particular. Cumpleaños 30 en casa, ~25 personas.',
    createdAt: '2026-05-15T16:00:00.000Z',
  },
  {
    id: 'c4',
    name: 'Nuria Vidal',
    email: 'nuria@galaevents.es',
    phone: '+34 644 55 66 77',
    company: 'Gala Events',
    notes: 'Agencia pequeña de eventos. Subcontrata coctelería para sus clientes.',
    createdAt: '2026-05-05T08:15:00.000Z',
  },
]

// ----------------------------------------------------------------------------
// Partners / proveedores externos
// ----------------------------------------------------------------------------
export const mockPartners: Partner[] = [
  {
    id: 'pt1',
    name: 'DJ Marco',
    category: 'DJ',
    pricingType: 'fixed',
    hourlyRate: 0,
    fixedRate: 300,
    notes: 'DJ local con equipo propio. Precio cerrado por evento.',
    phone: '+34 700 11 22 33',
    email: 'marco@djmarco.es',
    createdAt: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'pt2',
    name: 'Estudio Lumen',
    category: 'Fotógrafo',
    pricingType: 'fixed',
    hourlyRate: 0,
    fixedRate: 250,
    notes: 'Fotógrafo de eventos. Entrega galería online en 7 días.',
    phone: '+34 701 22 33 44',
    email: 'hola@estudiolumen.com',
    createdAt: '2026-05-02T10:00:00.000Z',
  },
  {
    id: 'pt3',
    name: 'Sara Acústico',
    category: 'Músico',
    pricingType: 'fixed',
    hourlyRate: 0,
    fixedRate: 180,
    notes: 'Músico acústico (voz + guitarra). Ideal para bodas y cócteles.',
    phone: '+34 702 33 44 55',
    email: 'sara@saraacustico.es',
    createdAt: '2026-05-03T10:00:00.000Z',
  },
  {
    id: 'pt4',
    name: 'FlashBox',
    category: 'Fotomatón',
    pricingType: 'fixed',
    hourlyRate: 0,
    fixedRate: 350,
    notes: 'Fotomatón con atrezzo y galería digital. Precio por 3 horas.',
    phone: '+34 703 44 55 66',
    email: 'info@flashbox.es',
    createdAt: '2026-05-04T10:00:00.000Z',
  },
  {
    id: 'pt5',
    name: 'Equipo Catering Plus',
    category: 'Camarero',
    pricingType: 'hourly',
    hourlyRate: 15,
    fixedRate: 0,
    notes: 'Camareros extra por hora. Mínimo 4 horas.',
    phone: '+34 704 55 66 77',
    email: 'rrhh@cateringplus.es',
    createdAt: '2026-05-05T10:00:00.000Z',
  },
  {
    id: 'pt6',
    name: 'SoundTech Pro',
    category: 'Técnico sonido',
    pricingType: 'fixed',
    hourlyRate: 0,
    fixedRate: 120,
    notes: 'Técnico de sonido con montaje y desmontaje incluidos.',
    phone: '+34 705 66 77 88',
    email: 'tec@soundtechpro.es',
    createdAt: '2026-05-06T10:00:00.000Z',
  },
]

// ----------------------------------------------------------------------------
// Paquetes
// ----------------------------------------------------------------------------
export const mockPackages: Package[] = [
  {
    id: 'pk1',
    name: 'Corner de coctelería básico — 3 horas',
    description:
      'Montaje de barra de coctelería con 4 cócteles de autor para hasta 40 personas durante 3 horas.',
    baseHours: 3,
    baseCost: 280,
    recommendedPrice: 650,
    marginTarget: 40,
    partnerIds: [],
    customItems: [
      { name: 'Cócteles de autor', category: 'Bebida', quantity: 40, unitCost: 4, unitPrice: 8, isVisibleToClient: true },
      { name: 'Hielo', category: 'Hielo', quantity: 3, unitCost: 5, unitPrice: 10, isVisibleToClient: true },
      { name: 'Vasos y consumibles', category: 'Vasos', quantity: 80, unitCost: 0.15, unitPrice: 0.3, isVisibleToClient: true },
      { name: 'Bartender profesional', category: 'Personal', quantity: 1, unitCost: 54, unitPrice: 108, isVisibleToClient: true },
      { name: 'Transporte', category: 'Transporte', quantity: 1, unitCost: 19, unitPrice: 38, isVisibleToClient: false },
      { name: 'Materiales y reposición', category: 'Otros', quantity: 1, unitCost: 20, unitPrice: 40, isVisibleToClient: false },
    ],
    createdAt: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'pk2',
    name: 'Corner de coctelería premium — 5 horas',
    description:
      'Barra premium con 6 cócteles de autor, ginebra y ron de gama, para hasta 70 personas durante 5 horas.',
    baseHours: 5,
    baseCost: 520,
    recommendedPrice: 1100,
    marginTarget: 40,
    partnerIds: [],
    customItems: [
      { name: 'Cócteles premium', category: 'Bebida', quantity: 70, unitCost: 4.5, unitPrice: 9, isVisibleToClient: true },
      { name: 'Hielo', category: 'Hielo', quantity: 5, unitCost: 5, unitPrice: 10, isVisibleToClient: true },
      { name: 'Vasos y consumibles', category: 'Vasos', quantity: 140, unitCost: 0.15, unitPrice: 0.3, isVisibleToClient: true },
      { name: 'Bartender profesional', category: 'Personal', quantity: 1, unitCost: 90, unitPrice: 180, isVisibleToClient: true },
      { name: 'Decoración de barra', category: 'Decoración', quantity: 1, unitCost: 30, unitPrice: 60, isVisibleToClient: true },
      { name: 'Transporte', category: 'Transporte', quantity: 1, unitCost: 19, unitPrice: 38, isVisibleToClient: false },
      { name: 'Materiales y reposición', category: 'Otros', quantity: 1, unitCost: 20, unitPrice: 40, isVisibleToClient: false },
    ],
    createdAt: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'pk3',
    name: 'Evento completo — coctelería + DJ + fotógrafo',
    description:
      'Paquete todo en uno: barra de coctelería 5h, DJ y fotógrafo. Pensado para fiestas privadas completas.',
    baseHours: 5,
    baseCost: 950,
    recommendedPrice: 1700,
    marginTarget: 40,
    partnerIds: ['pt1', 'pt2'],
    customItems: [
      { name: 'Cócteles de autor', category: 'Bebida', quantity: 50, unitCost: 4.5, unitPrice: 9, isVisibleToClient: true },
      { name: 'Hielo', category: 'Hielo', quantity: 4, unitCost: 5, unitPrice: 10, isVisibleToClient: true },
      { name: 'Vasos y consumibles', category: 'Vasos', quantity: 100, unitCost: 0.15, unitPrice: 0.3, isVisibleToClient: true },
      { name: 'Bartender profesional', category: 'Personal', quantity: 1, unitCost: 90, unitPrice: 180, isVisibleToClient: true },
      { name: 'Transporte', category: 'Transporte', quantity: 1, unitCost: 25, unitPrice: 50, isVisibleToClient: false },
      { name: 'Materiales y reposición', category: 'Otros', quantity: 1, unitCost: 25, unitPrice: 50, isVisibleToClient: false },
    ],
    createdAt: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'pk4',
    name: 'Afterwork empresa',
    description:
      'Coctelería + pinchos para afterworks corporativos. Hasta 40 personas durante 4 horas.',
    baseHours: 4,
    baseCost: 400,
    recommendedPrice: 900,
    marginTarget: 45,
    partnerIds: [],
    customItems: [
      { name: 'Cócteles', category: 'Bebida', quantity: 40, unitCost: 4, unitPrice: 8, isVisibleToClient: true },
      { name: 'Pinchos gourmet', category: 'Comida', quantity: 30, unitCost: 3, unitPrice: 6, isVisibleToClient: true },
      { name: 'Hielo', category: 'Hielo', quantity: 4, unitCost: 5, unitPrice: 10, isVisibleToClient: true },
      { name: 'Vasos y consumibles', category: 'Vasos', quantity: 100, unitCost: 0.15, unitPrice: 0.3, isVisibleToClient: true },
      { name: 'Bartender profesional', category: 'Personal', quantity: 1, unitCost: 72, unitPrice: 144, isVisibleToClient: true },
      { name: 'Transporte', category: 'Transporte', quantity: 1, unitCost: 18, unitPrice: 36, isVisibleToClient: false },
      { name: 'Materiales y reposición', category: 'Otros', quantity: 1, unitCost: 25, unitPrice: 50, isVisibleToClient: false },
    ],
    createdAt: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'pk5',
    name: 'Boda íntima',
    description:
      'Coctelería + comida + decoración para bodas pequeñas (hasta 50 invitados, 5 horas).',
    baseHours: 5,
    baseCost: 850,
    recommendedPrice: 1600,
    marginTarget: 45,
    partnerIds: [],
    customItems: [
      { name: 'Cócteles de autor', category: 'Bebida', quantity: 60, unitCost: 4.5, unitPrice: 9, isVisibleToClient: true },
      { name: 'Aperitivo y comida', category: 'Comida', quantity: 40, unitCost: 4, unitPrice: 8, isVisibleToClient: true },
      { name: 'Hielo', category: 'Hielo', quantity: 5, unitCost: 5, unitPrice: 10, isVisibleToClient: true },
      { name: 'Vasos y consumibles', category: 'Vasos', quantity: 120, unitCost: 0.15, unitPrice: 0.3, isVisibleToClient: true },
      { name: 'Decoración floral barra', category: 'Decoración', quantity: 1, unitCost: 100, unitPrice: 200, isVisibleToClient: true },
      { name: 'Bartender profesional', category: 'Personal', quantity: 1, unitCost: 90, unitPrice: 180, isVisibleToClient: true },
      { name: 'Transporte', category: 'Transporte', quantity: 1, unitCost: 37, unitPrice: 74, isVisibleToClient: false },
      { name: 'Materiales y reposición', category: 'Otros', quantity: 1, unitCost: 50, unitPrice: 100, isVisibleToClient: false },
    ],
    createdAt: '2026-05-01T10:00:00.000Z',
  },
]

// ----------------------------------------------------------------------------
// Eventos
// ----------------------------------------------------------------------------
export const mockEvents: Event[] = [
  {
    id: 'ev1',
    clientId: 'c1',
    name: 'Afterwork TechFin Q2',
    date: '2026-06-25',
    location: 'Oficinas TechFin, Valencia',
    type: 'Afterwork',
    attendees: 40,
    durationHours: 4,
    status: 'accepted',
    acceptedBudgetId: 'b1',
    notes: 'Montaje a las 17:00. Acceso por parking trasero.',
    createdAt: '2026-05-18T09:00:00.000Z',
  },
  {
    id: 'ev2',
    clientId: 'c2',
    name: 'Boda Carlos & Marta',
    date: '2026-07-12',
    location: 'Masía Can Ribera, Alicante',
    type: 'Boda',
    attendees: 50,
    durationHours: 5,
    status: 'quoted',
    acceptedBudgetId: 'b2',
    notes: 'Presupuesto enviado. Esperando respuesta. Sensibles al precio.',
    createdAt: '2026-05-20T09:00:00.000Z',
  },
  {
    id: 'ev3',
    clientId: 'c3',
    name: 'Cumpleaños 30 — Javier',
    date: '2026-06-18',
    location: 'Chalet privado, Valencia',
    type: 'Cumpleaños',
    attendees: 25,
    durationHours: 3,
    status: 'accepted',
    acceptedBudgetId: 'b3',
    notes: 'Zona ajardinada. Montaje exterior.',
    createdAt: '2026-05-16T09:00:00.000Z',
  },
  {
    id: 'ev4',
    clientId: 'c4',
    name: 'Evento privado día completo',
    date: '2026-05-30',
    location: 'Locación Gala Events, Castellón',
    type: 'Fiesta privada',
    attendees: 60,
    durationHours: 8,
    status: 'completed',
    acceptedBudgetId: 'b4',
    notes: 'Evento subcontratado por Gala Events. Jornada completa. Horas extra de personal.',
    createdAt: '2026-05-08T09:00:00.000Z',
  },
]

// ----------------------------------------------------------------------------
// Presupuestos
// ----------------------------------------------------------------------------
export const mockBudgets: Budget[] = [
  {
    id: 'b1',
    eventId: 'ev1',
    clientId: 'c1',
    packageId: 'pk4',
    items: [
      { id: 'bi1', name: 'Cócteles', category: 'Bebida', quantity: 40, unitCost: 4, totalCost: 160, unitPrice: 8, totalPrice: 320, isInternalCost: false, isVisibleToClient: true },
      { id: 'bi2', name: 'Pinchos gourmet', category: 'Comida', quantity: 30, unitCost: 3, totalCost: 90, unitPrice: 6, totalPrice: 180, isInternalCost: false, isVisibleToClient: true },
      { id: 'bi3', name: 'Hielo', category: 'Hielo', quantity: 4, unitCost: 5, totalCost: 20, unitPrice: 10, totalPrice: 40, isInternalCost: false, isVisibleToClient: true },
      { id: 'bi4', name: 'Vasos y consumibles', category: 'Vasos', quantity: 100, unitCost: 0.15, totalCost: 15, unitPrice: 0.3, totalPrice: 30, isInternalCost: false, isVisibleToClient: true },
      { id: 'bi5', name: 'Bartender profesional', category: 'Personal', quantity: 1, unitCost: 72, totalCost: 72, unitPrice: 144, totalPrice: 144, isInternalCost: false, isVisibleToClient: true },
      { id: 'bi6', name: 'Transporte', category: 'Transporte', quantity: 1, unitCost: 18, totalCost: 18, unitPrice: 36, totalPrice: 36, isInternalCost: true, isVisibleToClient: false },
      { id: 'bi7', name: 'Materiales y reposición', category: 'Otros', quantity: 1, unitCost: 25, totalCost: 25, unitPrice: 50, totalPrice: 50, isInternalCost: false, isVisibleToClient: false },
    ],
    directCosts: 310,
    partnerCosts: 0,
    laborCosts: 72,
    indirectCosts: 18,
    totalCost: 400,
    targetMarginPercentage: 45,
    recommendedPriceWithoutVAT: 727.27,
    recommendedPriceWithVAT: 880,
    offeredPriceWithoutVAT: 743.8,
    offeredPriceWithVAT: 900,
    vatPercentage: 21,
    expectedProfit: 343.8,
    expectedMarginPercentage: 46.2,
    status: 'accepted',
    createdAt: '2026-05-18T09:30:00.000Z',
  },
  {
    id: 'b2',
    eventId: 'ev2',
    clientId: 'c2',
    packageId: 'pk5',
    items: [
      { id: 'bi10', name: 'Cócteles de autor', category: 'Bebida', quantity: 60, unitCost: 4.5, totalCost: 270, unitPrice: 9, totalPrice: 540, isInternalCost: false, isVisibleToClient: true },
      { id: 'bi11', name: 'Aperitivo y comida', category: 'Comida', quantity: 40, unitCost: 4, totalCost: 160, unitPrice: 8, totalPrice: 320, isInternalCost: false, isVisibleToClient: true },
      { id: 'bi12', name: 'Hielo', category: 'Hielo', quantity: 5, unitCost: 5, totalCost: 25, unitPrice: 10, totalPrice: 50, isInternalCost: false, isVisibleToClient: true },
      { id: 'bi13', name: 'Vasos y consumibles', category: 'Vasos', quantity: 120, unitCost: 0.15, totalCost: 18, unitPrice: 0.3, totalPrice: 36, isInternalCost: false, isVisibleToClient: true },
      { id: 'bi14', name: 'Decoración floral barra', category: 'Decoración', quantity: 1, unitCost: 100, totalCost: 100, unitPrice: 200, totalPrice: 200, isInternalCost: false, isVisibleToClient: true },
      { id: 'bi15', name: 'Bartender profesional', category: 'Personal', quantity: 1, unitCost: 90, totalCost: 90, unitPrice: 180, totalPrice: 180, isInternalCost: false, isVisibleToClient: true },
      { id: 'bi16', name: 'DJ Marco', category: 'Partner', quantity: 1, unitCost: 300, totalCost: 300, unitPrice: 600, totalPrice: 600, isInternalCost: false, isVisibleToClient: true },
      { id: 'bi17', name: 'Fotógrafo Estudio Lumen', category: 'Partner', quantity: 1, unitCost: 250, totalCost: 250, unitPrice: 500, totalPrice: 500, isInternalCost: false, isVisibleToClient: true },
      { id: 'bi18', name: 'Transporte', category: 'Transporte', quantity: 1, unitCost: 37, totalCost: 37, unitPrice: 74, totalPrice: 74, isInternalCost: true, isVisibleToClient: false },
      { id: 'bi19', name: 'Materiales y reposición', category: 'Otros', quantity: 1, unitCost: 50, totalCost: 50, unitPrice: 100, totalPrice: 100, isInternalCost: false, isVisibleToClient: false },
    ],
    directCosts: 623,
    partnerCosts: 550,
    laborCosts: 90,
    indirectCosts: 37,
    totalCost: 1400,
    targetMarginPercentage: 45,
    recommendedPriceWithoutVAT: 2545.45,
    recommendedPriceWithVAT: 3080,
    offeredPriceWithoutVAT: 1322.31,
    offeredPriceWithVAT: 1600,
    vatPercentage: 21,
    expectedProfit: -77.69,
    expectedMarginPercentage: -5.88,
    status: 'sent',
    createdAt: '2026-05-20T10:00:00.000Z',
  },
  {
    id: 'b3',
    eventId: 'ev3',
    clientId: 'c3',
    packageId: 'pk1',
    items: [
      { id: 'bi30', name: 'Cócteles de autor', category: 'Bebida', quantity: 40, unitCost: 4, totalCost: 160, unitPrice: 8, totalPrice: 320, isInternalCost: false, isVisibleToClient: true },
      { id: 'bi31', name: 'Hielo', category: 'Hielo', quantity: 3, unitCost: 5, totalCost: 15, unitPrice: 10, totalPrice: 30, isInternalCost: false, isVisibleToClient: true },
      { id: 'bi32', name: 'Vasos y consumibles', category: 'Vasos', quantity: 80, unitCost: 0.15, totalCost: 12, unitPrice: 0.3, totalPrice: 24, isInternalCost: false, isVisibleToClient: true },
      { id: 'bi33', name: 'Bartender profesional', category: 'Personal', quantity: 1, unitCost: 54, totalCost: 54, unitPrice: 108, totalPrice: 108, isInternalCost: false, isVisibleToClient: true },
      { id: 'bi34', name: 'Transporte', category: 'Transporte', quantity: 1, unitCost: 19, totalCost: 19, unitPrice: 38, totalPrice: 38, isInternalCost: true, isVisibleToClient: false },
      { id: 'bi35', name: 'Materiales y reposición', category: 'Otros', quantity: 1, unitCost: 20, totalCost: 20, unitPrice: 40, totalPrice: 40, isInternalCost: false, isVisibleToClient: false },
    ],
    directCosts: 192,
    partnerCosts: 0,
    laborCosts: 54,
    indirectCosts: 19,
    totalCost: 265,
    targetMarginPercentage: 40,
    recommendedPriceWithoutVAT: 441.67,
    recommendedPriceWithVAT: 534.42,
    offeredPriceWithoutVAT: 537.19,
    offeredPriceWithVAT: 650,
    vatPercentage: 21,
    expectedProfit: 272.19,
    expectedMarginPercentage: 50.67,
    status: 'accepted',
    createdAt: '2026-05-16T09:30:00.000Z',
  },
  {
    id: 'b4',
    eventId: 'ev4',
    clientId: 'c4',
    packageId: null,
    items: [
      { id: 'bi40', name: 'Cócteles de autor', category: 'Bebida', quantity: 50, unitCost: 4.5, totalCost: 225, unitPrice: 9, totalPrice: 450, isInternalCost: false, isVisibleToClient: true },
      { id: 'bi41', name: 'Aperitivo y comida', category: 'Comida', quantity: 30, unitCost: 4, totalCost: 120, unitPrice: 8, totalPrice: 240, isInternalCost: false, isVisibleToClient: true },
      { id: 'bi42', name: 'Hielo', category: 'Hielo', quantity: 6, unitCost: 5, totalCost: 30, unitPrice: 10, totalPrice: 60, isInternalCost: false, isVisibleToClient: true },
      { id: 'bi43', name: 'Vasos y consumibles', category: 'Vasos', quantity: 160, unitCost: 0.15, totalCost: 24, unitPrice: 0.3, totalPrice: 48, isInternalCost: false, isVisibleToClient: true },
      { id: 'bi44', name: 'Personal (2 bartenders, 8h)', category: 'Personal', quantity: 2, unitCost: 144, totalCost: 288, unitPrice: 288, totalPrice: 576, isInternalCost: false, isVisibleToClient: true },
      { id: 'bi45', name: 'Transporte', category: 'Transporte', quantity: 1, unitCost: 41, totalCost: 41, unitPrice: 82, totalPrice: 82, isInternalCost: true, isVisibleToClient: false },
    ],
    directCosts: 399,
    partnerCosts: 0,
    laborCosts: 288,
    indirectCosts: 41,
    totalCost: 728,
    targetMarginPercentage: 40,
    recommendedPriceWithoutVAT: 1213.33,
    recommendedPriceWithVAT: 1468.13,
    offeredPriceWithoutVAT: 826.45,
    offeredPriceWithVAT: 1000,
    vatPercentage: 21,
    expectedProfit: 98.45,
    expectedMarginPercentage: 11.9,
    status: 'accepted',
    createdAt: '2026-05-08T09:30:00.000Z',
  },
]

// ----------------------------------------------------------------------------
// Pagos
// ----------------------------------------------------------------------------
export const mockPayments: Payment[] = [
  {
    id: 'pay1',
    eventId: 'ev1',
    amount: 360,
    dueDate: '2026-06-10',
    status: 'paid',
    concept: 'Reserva 40% — Afterwork TechFin',
  },
  {
    id: 'pay2',
    eventId: 'ev1',
    amount: 540,
    dueDate: '2026-06-25',
    status: 'pending',
    concept: 'Resto 60% — Afterwork TechFin',
  },
  {
    id: 'pay3',
    eventId: 'ev3',
    amount: 650,
    dueDate: '2026-06-18',
    status: 'paid',
    concept: 'Total — Cumpleaños Javier',
  },
  {
    id: 'pay4',
    eventId: 'ev4',
    amount: 1000,
    dueDate: '2026-05-30',
    status: 'paid',
    concept: 'Total — Evento privado día completo',
  },
]

// ----------------------------------------------------------------------------
// Resultado post-evento (ev4): muestra desviación y pérdida de margen
// ----------------------------------------------------------------------------
export const mockPostEventResults: PostEventResult[] = [
  {
    eventId: 'ev4',
    chargedPrice: 1000,
    realCostLines: [
      { category: 'Bebida', budgeted: 225, real: 240 },
      { category: 'Comida', budgeted: 120, real: 130 },
      { category: 'Hielo', budgeted: 30, real: 30 },
      { category: 'Vasos', budgeted: 24, real: 24 },
      { category: 'Personal', budgeted: 288, real: 360 },
      { category: 'Transporte', budgeted: 41, real: 50 },
    ],
    realTotalCost: 834,
    notes:
      'El evento duró más de lo previsto: los bartenders hicieron 2 horas extra. El coste de personal superó lo presupuestado.',
    savedAt: '2026-05-31T12:00:00.000Z',
  },
]

// Marca de tiempo de la carga inicial
export const mockLoadedAt = now
