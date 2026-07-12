// ============================================================================
// EventMargin · Capa de persistencia local (localStorage)
// ----------------------------------------------------------------------------
// Esta es la única "fuente de verdad" de la demo. El resto de la app no
// accede directamente a localStorage: consume el store de Zustand, que a su
// vez usa este servicio.
//
// Cuando se conecte un backend (Supabase / API REST), basta con sustituir
// este archivo por una implementación que hable con la API manteniendo la
// misma superficie (load/save de slices). El store y los componentes no
// tendrían por qué cambiar.
// ============================================================================

const PREFIX = 'eventmargin:'

export function loadSlice<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch (err) {
    console.warn(`[localStorage] No se pudo leer "${key}"`, err)
    return fallback
  }
}

export function saveSlice<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (err) {
    console.warn(`[localStorage] No se pudo guardar "${key}"`, err)
  }
}

export function removeSlice(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch (err) {
    console.warn(`[localStorage] No se pudo borrar "${key}"`, err)
  }
}

export function clearAll(): void {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX))
    keys.forEach((k) => localStorage.removeItem(k))
  } catch (err) {
    console.warn('[localStorage] No se pudo limpiar el almacenamiento', err)
  }
}

export const STORAGE_KEYS = {
  clients: 'clients',
  partners: 'partners',
  packages: 'packages',
  events: 'events',
  budgets: 'budgets',
  payments: 'payments',
  postEventResults: 'postEventResults',
  seeded: 'seeded',
} as const
