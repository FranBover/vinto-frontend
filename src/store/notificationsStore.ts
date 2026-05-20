import { create } from 'zustand'

// ── Tipos de payload de eventos SignalR ──────────────────────────────────────

export interface NuevoPedidoPayload {
  pedidoId: number
  codigoSeguimiento: string
  nombreCliente: string
  total: number
  fechaCreacion: string
}

export interface PagoConfirmadoPayload {
  pedidoId: number
  codigoSeguimiento: string
  paymentId: string
  monto: number
  nombreCliente: string
  fechaPago: string
}

// ── Tipos de toasts ───────────────────────────────────────────────────────────

export type ToastTipo = 'nuevoPedido' | 'pagoConfirmado'

export interface ToastItem {
  id: string
  tipo: ToastTipo
  // Para nuevoPedido
  nuevoPedido?: NuevoPedidoPayload
  // Para pagoConfirmado
  pagoConfirmado?: PagoConfirmadoPayload
}

// ── Estado y acciones ─────────────────────────────────────────────────────────

interface NotificationsState {
  // Cola de toasts visibles
  toasts: ToastItem[]
  // Últimos eventos (para que páginas suscriptas reaccionen, p. ej. refresh)
  ultimoNuevoPedido: NuevoPedidoPayload | null
  ultimoPagoConfirmado: PagoConfirmadoPayload | null

  // Acciones para emitir eventos (las llama el hook desde AdminLayout)
  emitirNuevoPedido: (payload: NuevoPedidoPayload) => void
  emitirPagoConfirmado: (payload: PagoConfirmadoPayload) => void

  // Acción para cerrar un toast
  cerrarToast: (id: string) => void
}

function generarId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  toasts: [],
  ultimoNuevoPedido: null,
  ultimoPagoConfirmado: null,

  emitirNuevoPedido: (payload) => {
    const toast: ToastItem = {
      id: generarId(),
      tipo: 'nuevoPedido',
      nuevoPedido: payload,
    }
    set((state) => ({
      toasts: [...state.toasts, toast],
      ultimoNuevoPedido: payload,
    }))
  },

  emitirPagoConfirmado: (payload) => {
    const toast: ToastItem = {
      id: generarId(),
      tipo: 'pagoConfirmado',
      pagoConfirmado: payload,
    }
    set((state) => ({
      toasts: [...state.toasts, toast],
      ultimoPagoConfirmado: payload,
    }))
  },

  cerrarToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
}))
