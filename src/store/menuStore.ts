import { create } from 'zustand'
import type { MenuPublico } from '../types'
import { getMenu } from '../api/publicApi'

interface MenuState {
  data: Record<string, MenuPublico>
  loading: boolean
  error: string | null
  fetchMenu: (slug: string) => Promise<void>
  clearCache: () => void
}

export const useMenuStore = create<MenuState>((set, get) => ({
  data: {},
  loading: false,
  error: null,

  fetchMenu: async (slug) => {
    if (get().data[slug] || get().loading) return
    set({ loading: true, error: null })
    try {
      const menu = await getMenu(slug)
      set(state => ({ data: { ...state.data, [slug]: menu }, loading: false }))
    } catch {
      set({ loading: false, error: 'No se pudo cargar el menú' })
    }
  },

  clearCache: () => set({ data: {}, error: null }),
}))
