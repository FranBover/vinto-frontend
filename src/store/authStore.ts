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
    return { token: null, vencidoEn: getTokenExpMs(t) }
  }
  return { token: t, vencidoEn: null }
})()

interface AuthState {
  token: string | null
  adminId: number | null
  sesionExpirada: boolean
  /** Instante (ms) en que venció la sesión, para decir a qué hora dejó de recibir pedidos. */
  sesionExpiradaEn: number | null
  guardarToken: (token: string) => void
  logout: () => void
  /** Único camino para cerrar sesión por vencimiento (timer, 401 del interceptor, carga inicial). */
  expirarSesion: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: tokenInicial.token,
  adminId: tokenInicial.token ? parseAdminId(tokenInicial.token) : null,
  sesionExpirada: tokenInicial.vencidoEn !== null,
  sesionExpiradaEn: tokenInicial.vencidoEn,

  guardarToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token)
    set({ token, adminId: parseAdminId(token), sesionExpirada: false, sesionExpiradaEn: null })
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    set({ token: null, adminId: null })
  },

  expirarSesion: () => {
    const { token } = get()
    if (token === null) return

    // Otra pestaña pudo haber vuelto a iniciar sesión: ese token manda, no se lo pisa.
    const guardado = localStorage.getItem(TOKEN_KEY)
    if (guardado && guardado !== token && !tokenVencido(guardado)) {
      set({ token: guardado, adminId: parseAdminId(guardado) })
      return
    }

    // Un 401 con el token todavía vigente (revocado, reloj corrido) vence "ahora", no en su exp.
    const ahora = Date.now()
    const expMs = getTokenExpMs(token)
    localStorage.removeItem(TOKEN_KEY)
    set({
      token: null,
      adminId: null,
      sesionExpirada: true,
      sesionExpiradaEn: expMs !== null && expMs <= ahora ? expMs : ahora,
    })
  },

  isAuthenticated: () => {
    const { token } = get()
    return token !== null && !tokenVencido(token)
  },
}))

/**
 * ¿Hay una sesión vigente? Para código que corre fuera de React (la factory de SignalR). Lee de
 * `localStorage`, como el interceptor de Axios. Si el token ya venció cierra la sesión en vez de
 * dejar que el hub reintente para siempre. Devuelve un booleano a propósito: el JWT no sale de acá.
 */
export function sesionVigente(): boolean {
  const t = localStorage.getItem(TOKEN_KEY)
  if (!t) return false
  if (tokenVencido(t)) {
    useAuthStore.getState().expirarSesion()
    return false
  }
  return true
}
