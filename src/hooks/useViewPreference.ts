import { useState, useEffect } from 'react'

export type ViewType = 'list' | 'grid'

export function useViewPreference(key: string): [ViewType, (v: ViewType) => void] {
  const [view, setView] = useState<ViewType>(() => {
    const saved = localStorage.getItem(`view_pref_${key}`)
    if (saved === 'list' || saved === 'grid') return saved
    
    // Si no hay preferencia, listado por defecto en escritorio, grid en móvil
    if (typeof window !== 'undefined') {
      const isMobile = window.matchMedia('(max-width: 768px)').matches
      return isMobile ? 'grid' : 'list'
    }
    return 'list'
  })

  useEffect(() => {
    localStorage.setItem(`view_pref_${key}`, view)
  }, [key, view])

  return [view, setView]
}
