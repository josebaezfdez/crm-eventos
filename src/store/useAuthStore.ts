import { create } from 'zustand'

interface AuthState {
  token: string | null
  user: { id: string; email: string; name: string } | null
  login: (token: string, user: { id: string; email: string; name: string }) => void
  logout: () => void
}

import { useStore } from './useStore'

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('auth_token'),
  user: localStorage.getItem('auth_user') ? JSON.parse(localStorage.getItem('auth_user') as string) : null,
  login: (token, user) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))
    set({ token, user })
  },
  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    set({ token: null, user: null })
    useStore.getState().resetApp()
  },
}))
