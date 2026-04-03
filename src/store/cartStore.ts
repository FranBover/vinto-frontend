import { create } from 'zustand'
import type { Producto, ProductoExtra } from '../types'

export interface CartItem {
  producto: Producto
  extras: ProductoExtra[]
  cantidad: number
}

function itemKey(productoId: number, extrasIds: number[]): string {
  return `${productoId}-${[...extrasIds].sort().join(',')}`
}

interface CartState {
  items: CartItem[]
  agregarItem: (producto: Producto, extras: ProductoExtra[], cantidad?: number) => void
  quitarItem: (productoId: number, extrasIds: number[]) => void
  cambiarCantidad: (productoId: number, extrasIds: number[], cantidad: number) => void
  limpiarCarrito: () => void
  total: () => number
  cantidadTotal: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  agregarItem: (producto, extras, cantidad = 1) => {
    const key = itemKey(producto.id, extras.map(e => e.id))
    set(state => {
      const existing = state.items.find(
        i => itemKey(i.producto.id, i.extras.map(e => e.id)) === key
      )
      if (existing) {
        return {
          items: state.items.map(i =>
            itemKey(i.producto.id, i.extras.map(e => e.id)) === key
              ? { ...i, cantidad: i.cantidad + cantidad }
              : i
          ),
        }
      }
      return { items: [...state.items, { producto, extras, cantidad }] }
    })
  },

  quitarItem: (productoId, extrasIds) => {
    const key = itemKey(productoId, extrasIds)
    set(state => ({
      items: state.items.filter(
        i => itemKey(i.producto.id, i.extras.map(e => e.id)) !== key
      ),
    }))
  },

  cambiarCantidad: (productoId, extrasIds, cantidad) => {
    const key = itemKey(productoId, extrasIds)
    if (cantidad <= 0) {
      get().quitarItem(productoId, extrasIds)
      return
    }
    set(state => ({
      items: state.items.map(i =>
        itemKey(i.producto.id, i.extras.map(e => e.id)) === key
          ? { ...i, cantidad }
          : i
      ),
    }))
  },

  limpiarCarrito: () => set({ items: [] }),

  total: () =>
    get().items.reduce((sum, i) => {
      const extrasTotal = i.extras.reduce((s, e) => s + e.precioAdicional, 0)
      return sum + (i.producto.precio + extrasTotal) * i.cantidad
    }, 0),

  cantidadTotal: () =>
    get().items.reduce((sum, i) => sum + i.cantidad, 0),
}))
