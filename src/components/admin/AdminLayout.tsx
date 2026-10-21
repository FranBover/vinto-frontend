import { useCallback, useState, type ReactNode } from 'react'
import Sidebar from './Sidebar'
import NuevoPedidoToast from '../NuevoPedidoToast'
import PagoConfirmadoToast from './PagoConfirmadoToast'
import MercadoPagoStatusBanner from './MercadoPagoStatusBanner'
import SesionPorVencerBanner from './SesionPorVencerBanner'
import { ConexionBanner, ConexionChip } from './ConexionIndicador'
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
  const emitirReconexion = useNotificationsStore(s => s.emitirReconexion)
  const toasts =useNotificationsStore(s => s.toasts)
  const cerrarToast = useNotificationsStore(s => s.cerrarToast)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const cerrarMenu = useCallback(() => setMenuAbierto(false), [])

  const handleNuevoPedido = useCallback(
    (pedido: NuevoPedidoPayload) => emitirNuevoPedido(pedido),
    [emitirNuevoPedido]
  )
  const handlePagoConfirmado = useCallback(
    (pago: PagoConfirmadoPayload) => emitirPagoConfirmado(pago),
    [emitirPagoConfirmado]
  )

  const { connectionState } = usePedidosHub({
    adminId,
    onNuevoPedido: handleNuevoPedido,
    onPagoConfirmado: handlePagoConfirmado,
    onReconectado: emitirReconexion,
  })

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#fafaf9' }}>
      <Sidebar abierto={menuAbierto} onCerrar={cerrarMenu} />

      {/* Por debajo de md la sidebar es un drawer: este fondo lo cierra al tocar afuera */}
      {menuAbierto && (
        <div className="fixed inset-0 z-[35] bg-black/40 md:hidden" onClick={cerrarMenu} aria-hidden="true" />
      )}

      {/* Main content — offset by sidebar width (desde md; antes la sidebar es un drawer) */}
      <div className="flex-1 max-md:min-w-0 flex flex-col md:ml-[200px]">
        {/* Header */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 md:px-8 border-b border-[#e8e8e8]"
          style={{ backgroundColor: '#fafaf9', height: 64 }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú"
              aria-expanded={menuAbierto}
              className="md:hidden flex-shrink-0 flex items-center justify-center text-[#1a1a1a]"
              style={{ width: 44, height: 44, marginLeft: -10 }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-[17px] font-bold text-[#1a1a1a] leading-tight truncate">{title}</h1>
              {subtitle && (
                <p className="text-xs text-[#aaa] mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-5 flex-shrink-0">
            <ConexionChip state={connectionState} />
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </div>
        </header>

        <ConexionBanner state={connectionState} />
        <SesionPorVencerBanner />
        <MercadoPagoStatusBanner />

        {/* Page content */}
        <main className="flex-1 px-4 md:px-8 py-6">
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
