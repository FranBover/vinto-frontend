import { create } from 'zustand'
import type { Producto, ProductoExtra } from '../types'

export interface CartItem {
  producto: Producto
  extras: ProductoExtra[]
  cantidad: number
  varianteId?: number
  varianteDescripcion?: string
}

function itemKey(productoId: number, extrasIds: number[], varianteId?: number): string {
  const v = varianteId != null ? `:${varianteId}` : ''
  return `${productoId}-${[...extrasIds].sort().join(',')}${v}`
}

interface CartState {
  items: CartItem[]
  agregarItem: (producto: Producto, extras: ProductoExtra[], cantidad?: number, varianteId?: number, varianteDescripcion?: string) => void
  quitarItem: (productoId: number, extrasIds: number[], varianteId?: number) => void
  cambiarCantidad: (productoId: number, extrasIds: number[], cantidad: number, varianteId?: number) => void
  limpiarCarrito: () => void
  total: () => number
  cantidadTotal: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  agregarItem: (producto, extras, cantidad = 1, varianteId, varianteDescripcion) => {
    const key = itemKey(producto.id, extras.map(e => e.id), varianteId)
    set(state => {
      const existing = state.items.find(
        i => itemKey(i.producto.id, i.extras.map(e => e.id), i.varianteId) === key
      )
      if (existing) {
        return {
          items: state.items.map(i =>
            itemKey(i.producto.id, i.extras.map(e => e.id), i.varianteId) === key
              ? { ...i, cantidad: i.cantidad + cantidad }
              : i
          ),
        }
      }
      return { items: [...state.items, { producto, extras, cantidad, varianteId, varianteDescripcion }] }
    })
  },

  quitarItem: (productoId, extrasIds, varianteId) => {
    const key = itemKey(productoId, extrasIds, varianteId)
    set(state => ({
      items: state.items.filter(
        i => itemKey(i.producto.id, i.extras.map(e => e.id), i.varianteId) !== key
      ),
    }))
  },

  cambiarCantidad: (productoId, extrasIds, cantidad, varianteId) => {
    const key = itemKey(productoId, extrasIds, varianteId)
    if (cantidad <= 0) {
      get().quitarItem(productoId, extrasIds, varianteId)
      return
    }
    set(state => ({
      items: state.items.map(i =>
        itemKey(i.producto.id, i.extras.map(e => e.id), i.varianteId) === key
          ? { ...i, cantidad }
          : i
      ),
    }))
  },

  limpiarCarrito: () => set({ items: [] }),

  total: () =>
    get().items.reduce((sum, i) => {
      const extrasTotal = i.extras.reduce((s, e) => s + e.precioAdicional, 0)
      return sum + ((i.producto.precio ?? 0) + extrasTotal) * i.cantidad
    }, 0),

  cantidadTotal: () =>
    get().items.reduce((sum, i) => sum + i.cantidad, 0),
}))
