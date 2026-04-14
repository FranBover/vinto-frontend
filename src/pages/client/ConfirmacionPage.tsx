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
  telefono: string
  formaPago: FormaPago
  formaEntrega: FormaEntrega
  direccionCliente?: string
  referencia?: string
  ubicacionUrl?: string
  montoPagoEfectivo?: number
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

const pesos = (n: number) => `$${n.toLocaleString('es-AR')}`

function formatFecha(): string {
  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yy = String(now.getFullYear()).slice(2)
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yy} - ${hh}:${min} hs`
}

function buildWhatsAppText(state: LocationState): string {
  const { pedido, local, items, nombreCliente, telefono, formaPago,
          formaEntrega, direccionCliente, referencia, ubicacionUrl, montoPagoEfectivo } = state

  const lines: string[] = []

  lines.push('*¡Nuevo pedido!* 🛍️')
  lines.push('')
  lines.push(`*#${pedido.codigoSeguimiento}* · ${local.nombreLocal}`)
  lines.push(formatFecha())
  lines.push('')
  lines.push('*Cliente*')
  lines.push(nombreCliente)
  lines.push(telefono)
  lines.push('')
  lines.push('*Productos*')
  for (const item of items) {
    const precioUnitario = item.producto.precio + item.extras.reduce((s, e) => s + e.precioAdicional, 0)
    lines.push(`${item.cantidad}x ${item.producto.nombre}: ${pesos(precioUnitario * item.cantidad)}`)
    for (const extra of item.extras) {
      lines.push(`  + ${extra.nombre}: ${pesos(extra.precioAdicional)}`)
    }
  }
  lines.push('')
  if (pedido.subtotal !== pedido.total) {
    lines.push(`*Subtotal:* ${pesos(pedido.subtotal)}`)
  }
  if (formaEntrega === 'Delivery' && local.costoEnvio != null) {
    lines.push(`*Costo de envío:* ${pesos(local.costoEnvio)}`)
  }
  lines.push(`*Total:* ${pesos(pedido.total)}`)
  lines.push('')
  lines.push(`*Pago:* ${LABEL_PAGO[formaPago]}`)
  if (formaPago === 'Efectivo' && montoPagoEfectivo) {
    lines.push(`*Paga con:* ${pesos(montoPagoEfectivo)}`)
  }
  if (formaPago === 'Transferencia') {
    if (local.aliasTransferencia) lines.push(`Alias: ${local.aliasTransferencia}`)
    if (local.titularCuenta) lines.push(`Titular: ${local.titularCuenta}`)
  }
  lines.push('')
  lines.push(`*Entrega:* ${LABEL_ENTREGA[formaEntrega]}`)
  if (formaEntrega === 'Delivery') {
    if (direccionCliente) lines.push(`Dirección: ${direccionCliente}`)
    if (referencia) lines.push(`Referencia: ${referencia}`)
    if (ubicacionUrl) lines.push(`Ubicación: ${ubicacionUrl}`)
  }
  lines.push('')
  lines.push('_¡Espero tu confirmación!_')

  return encodeURIComponent(lines.join('\n'))
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

  useEffect(() => {
    limpiarCarrito()
  }, [limpiarCarrito])

  // Fallback: navegación directa sin state
  if (!state?.pedido || !state?.local) {
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

  const { pedido, local, formaPago, formaEntrega, nombreCliente, direccionCliente } = state

  const waNumber = getWhatsAppNumber(local.linkWhatsapp)
  const waLink = waNumber
    ? `https://wa.me/${waNumber}?text=${buildWhatsAppText(state)}`
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

        {formaEntrega === 'Delivery' && state.local.costoEnvio != null && (
          <div>
            <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1">
              Costo de envío
            </p>
            <p className="font-bold text-sm">{pesos(state.local.costoEnvio)}</p>
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
