import { create } from 'zustand'
import type { MenuPublico } from '../types'
import { getMenu } from '../api/publicApi'

interface MenuState {
  data: Record<string, MenuPublico>
  /** Instante (ms) en que se obtuvo el estado de cada local: ancla del "hoy" / "mañana" del aviso de cierre. */
  estadoAt: Record<string, number>
  loading: boolean
  error: string | null
  fetchMenu: (slug: string) => Promise<void>
  /** Vuelve a pedir el menú pero solo actualiza estado y horario: el catálogo que el cliente está mirando no se toca. */
  refrescarEstado: (slug: string) => Promise<void>
  clearCache: () => void
}

export const useMenuStore = create<MenuState>((set, get) => ({
  data: {},
  estadoAt: {},
  loading: false,
  error: null,

  fetchMenu: async (slug) => {
    if (get().data[slug] || get().loading) return
    set({ loading: true, error: null })
    try {
      const menu = await getMenu(slug)
      set(state => ({
        data: { ...state.data, [slug]: menu },
        estadoAt: { ...state.estadoAt, [slug]: Date.now() },
        loading: false,
      }))
    } catch {
      set({ loading: false, error: 'No se pudo cargar el menú' })
    }
  },

  refrescarEstado: async (slug) => {
    try {
      const menu = await getMenu(slug)
      set(state => {
        const actual = state.data[slug]
        if (!actual) return state
        return {
          data: { ...state.data, [slug]: { ...actual, estado: menu.estado, horario: menu.horario } },
          estadoAt: { ...state.estadoAt, [slug]: Date.now() },
        }
      })
    } catch {
      // Sin red no hay nada que mostrar de nuevo: queda el último estado conocido.
    }
  },

  clearCache: () => set({ data: {}, estadoAt: {}, error: null }),
}))
