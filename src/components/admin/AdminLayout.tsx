import { useCallback, type ReactNode } from 'react'
import Sidebar from './Sidebar'
import NuevoPedidoToast from '../NuevoPedidoToast'
import PagoConfirmadoToast from './PagoConfirmadoToast'
import MercadoPagoStatusBanner from './MercadoPagoStatusBanner'
import { usePedidosHub } from '../../hooks/usePedidosHub'
import { useAuthStore } from '../../store/authStore'
import {
  useNotificationsStore,
  type NuevoPedidoPayload,
  type PagoConfirmadoPayload,
} from '../../store/notificationsStore'

interface Props {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

export default function AdminLayout({ title, subtitle, actions, children }: Props) {
  const adminId = useAuthStore(s => s.adminId)
  const emitirNuevoPedido = useNotificationsStore(s => s.emitirNuevoPedido)
  const emitirPagoConfirmado = useNotificationsStore(s => s.emitirPagoConfirmado)
  const toasts = useNotificationsStore(s => s.toasts)
  const cerrarToast = useNotificationsStore(s => s.cerrarToast)

  const handleNuevoPedido = useCallback(
    (pedido: NuevoPedidoPayload) => emitirNuevoPedido(pedido),
    [emitirNuevoPedido]
  )
  const handlePagoConfirmado = useCallback(
    (pago: PagoConfirmadoPayload) => emitirPagoConfirmado(pago),
    [emitirPagoConfirmado]
  )

  usePedidosHub({
    adminId,
    onNuevoPedido: handleNuevoPedido,
    onPagoConfirmado: handlePagoConfirmado,
  })

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#fafaf9' }}>
      <Sidebar />

      {/* Main content — offset by sidebar width */}
      <div className="flex-1 flex flex-col" style={{ marginLeft: 200 }}>
        {/* Header */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-8 border-b border-[#e8e8e8]"
          style={{ backgroundColor: '#fafaf9', height: 64 }}
        >
          <div>
            <h1 className="text-[17px] font-bold text-[#1a1a1a] leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-xs text-[#aaa] mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </header>

        <MercadoPagoStatusBanner />

        {/* Page content */}
        <main className="flex-1 px-8 py-6">
          {children}
        </main>
      </div>

      {/* ── Stack de toasts apilados (fixed bottom-right) ──────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            {toast.tipo === 'nuevoPedido' && toast.nuevoPedido && (
              <NuevoPedidoToast
                pedido={toast.nuevoPedido}
                onClose={() => cerrarToast(toast.id)}
              />
            )}
            {toast.tipo === 'pagoConfirmado' && toast.pagoConfirmado && (
              <PagoConfirmadoToast
                pago={toast.pagoConfirmado}
                onClose={() => cerrarToast(toast.id)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
