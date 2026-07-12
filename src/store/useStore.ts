// ============================================================================
// EventMargin · Store global (Zustand + API Cloudflare)
// ----------------------------------------------------------------------------
// Único punto de acceso a los datos para toda la app.
// Ahora se comunica con el backend Hono/Cloudflare a través de fetch().
// ============================================================================

import { create } from 'zustand'
import type {
  Budget,
  Client,
  Company,
  Event,
  EventStatus,
  Package,
  Partner,
  Payment,
  PostEventResult,
  RealCostLine,
} from '../types'

import { buildBudgetSummary, recalcBudget } from '../utils/marginCalculator'
import { uid } from '../utils/format'

interface AppState {
  isInitialized: boolean
  appError: string | null
  clients: Client[]
  partners: Partner[]
  packages: Package[]
  events: Event[]
  budgets: Budget[]
  payments: Payment[]
  postEventResults: PostEventResult[]
  settings: Company | null

  // Clientes
  addClient: (c: Omit<Client, 'id' | 'createdAt'>) => Promise<Client>
  updateClient: (id: string, patch: Partial<Client>) => Promise<void>
  deleteClient: (id: string) => Promise<void>

  // Partners
  addPartner: (p: Omit<Partner, 'id' | 'createdAt'>) => Promise<Partner>
  updatePartner: (id: string, patch: Partial<Partner>) => Promise<void>
  deletePartner: (id: string) => Promise<void>

  // Paquetes
  addPackage: (p: Omit<Package, 'id' | 'createdAt'>) => Promise<Package>
  updatePackage: (id: string, patch: Partial<Package>) => Promise<void>
  deletePackage: (id: string) => Promise<void>

  // Eventos
  addEvent: (e: Omit<Event, 'id' | 'createdAt'>) => Promise<Event>
  updateEvent: (id: string, patch: Partial<Event>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  setEventStatus: (id: string, status: EventStatus) => Promise<void>

  // Presupuestos
  addBudget: (b: Omit<Budget, 'id' | 'createdAt'>) => Promise<Budget>
  updateBudget: (id: string, patch: Partial<Budget>) => Promise<void>
  deleteBudget: (id: string) => Promise<void>

  // Pagos
  addPayment: (p: Omit<Payment, 'id'>) => Promise<Payment>
  updatePayment: (id: string, patch: Partial<Payment>) => Promise<void>
  deletePayment: (id: string) => Promise<void>

  // Post-evento
  upsertPostEventResult: (
    eventId: string,
    data: { chargedPrice: number; realCostLines: RealCostLine[]; notes: string },
  ) => Promise<void>

  // Sistema
  initApp: () => Promise<void>
  updateSettings: (patch: Partial<Company>) => Promise<void>
  resetApp: () => void
}

import { API_BASE_URL } from '../config'
const BASE_URL = API_BASE_URL

const getHeaders = () => {
  const token = localStorage.getItem('auth_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
}

const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    window.dispatchEvent(new Event('auth-unauthorized'))
    throw new Error('Sesión caducada o no autorizada. Por favor, inicia sesión de nuevo.')
  }
  if (!res.ok) {
    let errMsg = 'Error en la petición'
    try {
      const errData = await res.json()
      errMsg = errData.error || errData.message || errMsg
    } catch (e) {
      // Ignorar
    }
    throw new Error(errMsg)
  }
  
  // Para 204 No Content o si no hay body, devolver true
  const contentType = res.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return res.json()
  }
  return { success: true }
}

const api = {
  get: (url: string) => fetch(BASE_URL + url, { headers: getHeaders() }).then(handleResponse),
  post: (url: string, data: any) => fetch(BASE_URL + url, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  put: (url: string, data: any) => fetch(BASE_URL + url, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  delete: (url: string) => fetch(BASE_URL + url, { 
    method: 'DELETE', 
    headers: localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {}
  }).then(handleResponse),
}

export const useStore = create<AppState>((set, get) => ({
  isInitialized: false,
  appError: null,
  clients: [],
  partners: [],
  packages: [],
  events: [],
  budgets: [],
  payments: [],
  postEventResults: [],
  settings: null,

  // --- Clientes ---
  addClient: async (c) => {
    const client: Client = { ...c, id: uid('c'), createdAt: new Date().toISOString() }
    await api.post('/api/clients', client)
    set({ clients: [...get().clients, client] })
    return client
  },
  updateClient: async (id, patch) => {
    await api.put(`/api/clients/${id}`, patch)
    set({ clients: get().clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
  },
  deleteClient: async (id) => {
    await api.delete(`/api/clients/${id}`)
    set({ clients: get().clients.filter((c) => c.id !== id) })
  },

  // --- Partners ---
  addPartner: async (p) => {
    const partner: Partner = { ...p, id: uid('pt'), createdAt: new Date().toISOString() }
    await api.post('/api/partners', partner)
    set({ partners: [...get().partners, partner] })
    return partner
  },
  updatePartner: async (id, patch) => {
    await api.put(`/api/partners/${id}`, patch)
    set({ partners: get().partners.map((p) => (p.id === id ? { ...p, ...patch } : p)) })
  },
  deletePartner: async (id) => {
    await api.delete(`/api/partners/${id}`)
    set({ partners: get().partners.filter((p) => p.id !== id) })
  },

  // --- Paquetes ---
  addPackage: async (p) => {
    const pkg: Package = { ...p, id: uid('pk'), createdAt: new Date().toISOString() }
    await api.post('/api/packages', pkg)
    set({ packages: [...get().packages, pkg] })
    return pkg
  },
  updatePackage: async (id, patch) => {
    await api.put(`/api/packages/${id}`, patch)
    set({ packages: get().packages.map((p) => (p.id === id ? { ...p, ...patch } : p)) })
  },
  deletePackage: async (id) => {
    await api.delete(`/api/packages/${id}`)
    set({ packages: get().packages.filter((p) => p.id !== id) })
  },

  // --- Eventos ---
  addEvent: async (e) => {
    const event: Event = { ...e, id: uid('ev'), createdAt: new Date().toISOString() }
    await api.post('/api/events', event)
    set({ events: [...get().events, event] })
    return event
  },
  updateEvent: async (id, patch) => {
    await api.put(`/api/events/${id}`, patch)
    set({ events: get().events.map((e) => (e.id === id ? { ...e, ...patch } : e)) })
  },
  deleteEvent: async (id) => {
    await api.delete(`/api/events/${id}`)
    set({ 
      events: get().events.filter((e) => e.id !== id),
      budgets: get().budgets.filter((b) => b.eventId !== id),
      payments: get().payments.filter((p) => p.eventId !== id),
      postEventResults: get().postEventResults.filter((r) => r.eventId !== id)
    })
  },
  setEventStatus: async (id, status) => {
    await get().updateEvent(id, { status })
    if (status === 'accepted') {
      const ev = get().events.find((e) => e.id === id)
      if (ev?.acceptedBudgetId) {
        await get().updateBudget(ev.acceptedBudgetId, { status: 'accepted' })
      }
    }
  },

  // --- Presupuestos ---
  addBudget: async (b) => {
    const budget: Budget = recalcBudget({ ...b, id: uid('b'), createdAt: new Date().toISOString() })
    await api.post('/api/budgets', budget)
    set({ budgets: [...get().budgets, budget] })
    
    // Vincula el presupuesto a su evento
    if (budget.eventId) {
      const event = get().events.find(e => e.id === budget.eventId)
      const isFirstBudget = !event?.acceptedBudgetId
      const updateData: any = { status: 'quoted' }
      if (isFirstBudget) {
        updateData.acceptedBudgetId = budget.id
      }
      await get().updateEvent(budget.eventId, updateData)
    }
    return budget
  },
  updateBudget: async (id, patch) => {
    const current = get().budgets.find((b) => b.id === id)
    if (!current) return
    const merged = { ...current, ...patch }
    const recalced = recalcBudget(merged)
    await api.put(`/api/budgets/${id}`, recalced)
    set({ budgets: get().budgets.map((b) => (b.id === id ? recalced : b)) })
  },
  deleteBudget: async (id) => {
    await api.delete(`/api/budgets/${id}`)
    set({ budgets: get().budgets.filter((b) => b.id !== id) })
    set({ events: get().events.map((e) => e.acceptedBudgetId === id ? { ...e, acceptedBudgetId: null } : e) })
  },

  // --- Pagos ---
  addPayment: async (p) => {
    const payment: Payment = { ...p, id: uid('pay') }
    await api.post('/api/payments', payment)
    set({ payments: [...get().payments, payment] })
    return payment
  },
  updatePayment: async (id, patch) => {
    await api.put(`/api/payments/${id}`, patch)
    set({ payments: get().payments.map((p) => (p.id === id ? { ...p, ...patch } : p)) })
  },
  deletePayment: async (id) => {
    await api.delete(`/api/payments/${id}`)
    set({ payments: get().payments.filter((p) => p.id !== id) })
  },

  // --- Post-evento ---
  upsertPostEventResult: async (eventId, data) => {
    const existing = get().postEventResults.find((r) => r.eventId === eventId)
    const realTotalCost = data.realCostLines.reduce((acc, l) => acc + l.real, 0)
    const result: PostEventResult = existing
      ? { ...existing, ...data, realTotalCost, savedAt: new Date().toISOString() }
      : { eventId, ...data, realTotalCost, savedAt: new Date().toISOString() }
    
    await api.post('/api/postEventResults', result)
    
    const next = existing
      ? get().postEventResults.map((r) => (r.eventId === eventId ? result : r))
      : [...get().postEventResults, result]
    set({ postEventResults: next })
  },

  // --- Sistema ---
  initApp: async () => {
    try {
      const data = await api.get('/api/all')
      set({
        isInitialized: true,
        appError: null,
        settings: data.settings || null,
        clients: data.clients || [],
        partners: data.partners || [],
        packages: data.packages || [],
        events: data.events || [],
        budgets: data.budgets || [],
        payments: data.payments || [],
        postEventResults: data.postEventResults || [],
      })
    } catch (e: any) {
      console.error("Error connecting to backend", e)
      set({ isInitialized: true, appError: e.message || 'Error al conectar con el servidor. Por favor, reinténtalo.' })
    }
  },
  updateSettings: async (patch) => {
    await api.put('/api/settings', patch)
    const current = get().settings || {} as Company
    set({ settings: { ...current, ...patch } })
  },
  resetApp: () => {
    set({
      isInitialized: false,
      appError: null,
      clients: [],
      partners: [],
      packages: [],
      events: [],
      budgets: [],
      payments: [],
      postEventResults: [],
      settings: null,
    })
  }
}))

export { buildBudgetSummary }
