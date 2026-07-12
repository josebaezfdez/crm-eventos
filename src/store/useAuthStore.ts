import { create } from 'zustand'
import { API_BASE_URL } from '../config'

export interface CompanyMembership {
  id: string
  userId: string
  companyId: string
  role: string
  status: string
}

interface AuthState {
  token: string | null
  user: { id: string; email: string; name: string; companyId?: string } | null
  memberships: CompanyMembership[]
  login: (token: string, user: { id: string; email: string; name: string; companyId?: string }, memberships?: CompanyMembership[]) => void
  setToken: (token: string) => void
  setMemberships: (memberships: CompanyMembership[]) => void
  register: (data: any) => Promise<void>
  switchWorkspace: (companyId: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('auth_token'),
  user: localStorage.getItem('auth_user') ? JSON.parse(localStorage.getItem('auth_user') as string) : null,
  memberships: localStorage.getItem('auth_memberships') ? JSON.parse(localStorage.getItem('auth_memberships') as string) : [],
  
  login: (token, user, memberships = []) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))
    localStorage.setItem('auth_memberships', JSON.stringify(memberships))
    set({ token, user, memberships })
  },
  
  setToken: (token) => {
    localStorage.setItem('auth_token', token)
    set({ token })
  },
  
  setMemberships: (memberships) => {
    localStorage.setItem('auth_memberships', JSON.stringify(memberships))
    set({ memberships })
  },

  register: async (data: any) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al registrar')
    }
    const result = await res.json()
    get().login(result.token, result.user, result.memberships)
  },

  switchWorkspace: async (companyId: string) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/switch-workspace`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${get().token}`
      },
      body: JSON.stringify({ companyId })
    })
    if (!res.ok) {
      throw new Error('Error al cambiar de workspace')
    }
    const result = await res.json()
    // Update token
    get().setToken(result.token)
    // Update user's companyId
    const currentUser = get().user
    if (currentUser) {
      get().login(result.token, { ...currentUser, companyId }, get().memberships)
    }
    window.dispatchEvent(new Event('workspace-switched'))
  },

  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_memberships')
    set({ token: null, user: null, memberships: [] })
  },
}))
