import { create } from 'zustand'

const TOKEN_KEY = 'vinto_admin_token'

function parseAdminId(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as Record<string, unknown>
    const id = payload['adminId'] ?? payload['sub'] ?? payload['nameid']
    return id !== undefined ? Number(id) : null
  } catch {
    return null
  }
}

interface AuthState {
  token: string | null
  adminId: number | null
  guardarToken: (token: string) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem(TOKEN_KEY),
  adminId: (() => {
    const t = localStorage.getItem(TOKEN_KEY)
    return t ? parseAdminId(t) : null
  })(),

  guardarToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token)
    set({ token, adminId: parseAdminId(token) })
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    set({ token: null, adminId: null })
  },

  isAuthenticated: () => get().token !== null,
}))
