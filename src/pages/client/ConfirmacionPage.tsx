import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'
import type { CartItem } from '../../store/cartStore'
import type { LocalPublico, PedidoCreateResponse, FormaPago, FormaEntrega } from '../../types'

interface LocationState {
  pedido: PedidoCreateResponse
  local: LocalPublico
  items: CartItem[]
  nombreCliente: string
  formaPago: FormaPago
  formaEntrega: FormaEntrega
  direccionCliente?: string
}

const LABEL_PAGO: Record<FormaPago, string> = {
  Efectivo: 'Efectivo',
  Transferencia: 'Transferencia',
  Tarjeta: 'Mercado Pago',
}

const LABEL_ENTREGA: Record<FormaEntrega, string> = {
  Local: 'Retiro en local',
  Delivery: 'Delivery',
}

function getWhatsAppNumber(linkWhatsapp: string | null): string | null {
  if (!linkWhatsapp) return null
  const match = linkWhatsapp.match(/wa\.me\/(\d+)/)
  if (match) return match[1]
  const digits = linkWhatsapp.replace(/\D/g, '')
  return digits || null
}

export default function ConfirmacionPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const limpiarCarrito = useCartStore(s => s.limpiarCarrito)

  const state = location.state as LocationState | null
  const pedido = state?.pedido
  const local = state?.local
  const nombreCliente = state?.nombreCliente
  const formaPago = state?.formaPago
  const formaEntrega = state?.formaEntrega
  const direccionCliente = state?.direccionCliente

  useEffect(() => {
    limpiarCarrito()
  }, [limpiarCarrito])

  // Fallback: navegación directa sin state
  if (!pedido || !local) {
    return (
      <div className="min-h-screen bg-white text-[#1a1a1a] font-sans flex flex-col items-center justify-center px-8 gap-6">
        <p className="font-bold text-lg text-center">¡Pedido recibido!</p>
        <p className="text-sm text-[#999] text-center">
          En breve te contactamos para confirmar.
        </p>
        <button
          onClick={() => navigate(`/${slug}`)}
          className="bg-[#1a1a1a] text-white px-6 py-3 font-bold text-sm rounded-none"
        >
          Volver al menú
        </button>
      </div>
    )
  }

  const waNumber = getWhatsAppNumber(local.linkWhatsapp)
  const waLink = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(pedido.resumenWhatsApp)}`
    : null

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] font-sans pb-10">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="border-b border-[#1a1a1a] h-14 flex items-center px-4">
        <h1 className="font-bold text-[15px]">Pedido recibido</h1>
      </header>

      {/* ── Status badge ───────────────────────────────────────── */}
      <div className="bg-[#eaf4e8] text-[#2d5a27] px-4 py-3 border-b border-[#d0e8cc]">
        <p className="text-[11px] font-bold uppercase tracking-widest">Estado</p>
        <p className="font-bold text-base mt-0.5">Recibido · En espera de confirmación</p>
      </div>

      {/* ── Order summary ──────────────────────────────────────── */}
      <div className="px-4 py-6 space-y-5">
        <div>
          <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1">
            Número de pedido
          </p>
          <p className="font-bold text-2xl tabular-nums">{pedido.codigoSeguimiento}</p>
        </div>

        {nombreCliente && (
          <div>
            <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1">
              Nombre
            </p>
            <p className="font-bold text-base">{nombreCliente}</p>
          </div>
        )}

        <div className="flex gap-8">
          {formaEntrega && (
            <div>
              <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1">
                Entrega
              </p>
              <p className="font-bold text-sm">{LABEL_ENTREGA[formaEntrega]}</p>
            </div>
          )}
          {formaPago && (
            <div>
              <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1">
                Pago
              </p>
              <p className="font-bold text-sm">{LABEL_PAGO[formaPago]}</p>
            </div>
          )}
        </div>

        {direccionCliente && (
          <div>
            <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1">
              Dirección
            </p>
            <p className="text-sm">{direccionCliente}</p>
          </div>
        )}

        <div className="border-t border-[#e8e8e8] pt-5 flex items-center justify-between">
          <p className="font-bold text-base">Total</p>
          <p className="font-bold text-2xl">${pedido.total.toLocaleString('es-AR')}</p>
        </div>
      </div>

      {/* ── WhatsApp CTA ───────────────────────────────────────── */}
      <div className="px-4 pt-2 pb-8 space-y-4">
        <p className="text-sm text-[#666] leading-relaxed">
          Enviá el comprobante de pago por WhatsApp para confirmar tu pedido.
        </p>
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full bg-[#1a1a1a] text-white py-4 font-bold text-sm rounded-none"
          >
            <span className="w-2 h-2 rounded-full bg-[#2d5a27] shrink-0" />
            Confirmar por WhatsApp
          </a>
        ) : (
          <div className="w-full bg-[#e8e8e8] text-[#999] py-4 font-bold text-sm text-center">
            Configurá el link de WhatsApp en Mi local
          </div>
        )}
        <button
          onClick={() => navigate(`/${slug}`)}
          className="w-full border border-[#e8e8e8] text-[#1a1a1a] py-3.5 text-sm font-bold rounded-none"
        >
          Volver al menú
        </button>
      </div>
    </div>
  )
}
