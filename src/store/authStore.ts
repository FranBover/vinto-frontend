import { create } from 'zustand'

const TOKEN_KEY = 'vinto_admin_token'

function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64)) as Record<string, unknown>
  } catch {
    return null
  }
}

function parseAdminId(token: string): number | null {
  const payload = decodePayload(token)
  if (!payload) return null
  const id = payload['adminId'] ?? payload['sub'] ?? payload['nameid']
  return id !== undefined ? Number(id) : null
}

/** Claim `exp` en milisegundos, o null si el token no lo trae o no se puede leer. */
export function getTokenExpMs(token: string): number | null {
  const exp = decodePayload(token)?.['exp']
  return typeof exp === 'number' ? exp * 1000 : null
}

function tokenVencido(token: string): boolean {
  const expMs = getTokenExpMs(token)
  return expMs !== null && expMs <= Date.now()
}

// Si el token guardado ya venció, se descarta al cargar y se avisa en el login.
const tokenInicial = (() => {
  const t = localStorage.getItem(TOKEN_KEY)
  if (t && tokenVencido(t)) {
    localStorage.removeItem(TOKEN_KEY)
    return { token: null, vencido: true }
  }
  return { token: t, vencido: false }
})()

interface AuthState {
  token: string | null
  adminId: number | null
  sesionExpirada: boolean
  guardarToken: (token: string) => void
  logout: () => void
  /** Único camino para cerrar sesión por vencimiento (timer, 401 del interceptor, carga inicial). */
  expirarSesion: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: tokenInicial.token,
  adminId: tokenInicial.token ? parseAdminId(tokenInicial.token) : null,
  sesionExpirada: tokenInicial.vencido,

  guardarToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token)
    set({ token, adminId: parseAdminId(token), sesionExpirada: false })
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    set({ token: null, adminId: null })
  },

  expirarSesion: () => {
    if (get().token === null) return
    localStorage.removeItem(TOKEN_KEY)
    set({ token: null, adminId: null, sesionExpirada: true })
  },

  isAuthenticated: () => {
    const { token } = get()
    return token !== null && !tokenVencido(token)
  },
}))
